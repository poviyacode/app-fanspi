import { Component, ComponentRef, effect, HostListener, inject, Input, OnInit, PLATFORM_ID, signal, ViewChild, ViewContainerRef, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { TipService } from '@services/tip.service';
import { Subscription as RxSubscription } from 'rxjs';
import { DialogService } from '@services/dialog.service';
import { SubscriptionService } from '@services/subscription.service';
import { Subscription } from '@interfaces/subscription';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { TipComponent } from '@shared/tip/tip.component';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '@services/chat.service';
import { SpinnerService } from '@services/spinner.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UIStyles } from '@core/common/uistyles';
import { ToastService } from '@services/toast.service';
import { User } from '@interfaces/user';
import { UserService } from '@services/user.service';
import { MessageService } from '@services/message.service';
import { Title } from '@angular/platform-browser';
import { IconDirective } from '@directive/coin-svg.directive';
import { DateDifferencePipe } from '@pipes/date-difference.pipe';

export interface Count {
  total: number,
  active: number,
  expired: number
}

@Component({
  selector: 'app-list-subscriptions',
  imports: [
    CustomTranslatePipe,
    DateDifferencePipe,
    RouterModule,
    ReactiveFormsModule,
    CommonModule,
    IconDirective
  ],
  templateUrl: './list-subscriptions.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './list-subscriptions.component.scss'
})
export default class ListSubscriptionsComponent {

  isBrowser: boolean;
  isServer: boolean;

  hasMore = true;
  loading = signal(false);
  currentPage = 0;
  limitPage = 10;
  totalPage: 0;

  count = signal<Count | null>(null);
  search: string | null;

  private destroy$ = new Subject<void>();
  rxSubscriptions: RxSubscription[] = [];

  url: string;
  myFormSearch: FormGroup;

  // components
  private tipComponentRef: ComponentRef<TipComponent> | null = null;

  public router = inject(Router);
  public authService = inject(AuthService);
  private tipService = inject(TipService);
  private dialogService = inject(DialogService);
  private location = inject(Location);
  public subscriptionService = inject(SubscriptionService);
  private activatedRoute = inject(ActivatedRoute);
  private chatService = inject(ChatService);
  private spinnerService = inject(SpinnerService);
  private toastService = inject(ToastService);
  private userService = inject(UserService);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private messageService = inject(MessageService);
  private title = inject(Title);

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    this.title.setTitle('Subscription');

    this.search = this.activatedRoute.snapshot.queryParamMap.get('search');

    if (this.isBrowser) {
      this.activatedRoute.paramMap.subscribe(params => {
        this.url = params.get('status') || '';

        if (this.url) {
          this.subscriptionService.resetSubscribersUser();
        }

        this.hasMore = true;
        this.currentPage = 0;
        this.findAll();

      });
    }
  }

  ngOnInit(): void {
    this.createFormControls();
  }

  ngOnDestroy(): void {
    this.dialogService.closeModal();
    this.destroy$.next();
    this.destroy$.complete();
    this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
    if (this.myFormSearch) {
      this.myFormSearch.reset();
    }

    this.subscriptionService.resetSubscribersUser();
  }

  createFormControls() {
    this.myFormSearch = new FormGroup({
      search: new FormControl(this.search ? this.search : '', Validators.required),
    });
  }

  findAll() {
    if (!this.hasMore) return;

    this.loading.set(true);

    const data: any = {};

    if (this.search) {
      data.search = this.search;
    }

    if (this.url) {
      data.status = this.url === 'active' ? 'ACTIVE' : 'EXPIRED';
    }

    this.subscriptionService.findAllSubscriptionsUser(data, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && res.data.length > 0) {
            if (this.currentPage === 0) {
              this.subscriptionService.resetSubscribersUser();
              this.totalPage = res.total;
              const dataCount: Count = {
                total: res.total,
                active: res.active,
                expired: res.expired
              }
              this.count.set(dataCount);
            }

            const currentItems = this.subscriptionService.subscribersUser();
            const newItems = res.data.filter((newPost: Subscription) => {
              return !currentItems.some(existing => existing._id === newPost._id);
            });
            const updatedItems = [...currentItems, ...newItems];
            this.subscriptionService.addSubscribersUser(updatedItems);
            this.hasMore = res.data.length <= this.limitPage;
          } else {
            this.hasMore = false;
          }
        },
        error: (err) => {
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        }
      });
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      if (this.hasMore && !this.loading()) {
        this.currentPage = this.currentPage + this.limitPage;
        this.findAll();
      }
    }
  }

  // search
  onSubmit(): void {
    this.search = this.myFormSearch.value.search;

    const route = this.url ? ['admin/community/subscriptions', this.url] : ['admin/community/subscriptions'];

    this.router.navigate(route, {
      queryParams: this.search ? { search: this.search } : {}
    });

    this.limitPage = 20;
    this.currentPage = 0;
    this.hasMore = true;

    this.subscriptionService.resetSubscribersUser();
    this.findAll();
  }

  // tip
  async onTip(item: Subscription) {

    const dataTip = {
      type: 'TIP',
      typeContent: 'ACCOUNT',
      user: item.Join
    };

    this.tipService.addTip(dataTip);

    this.dialogService.toggleModal('tipCredit');
  }

  // create chat
  async onChat(item: Subscription) {
    const data: { Sender: User, Receiver: User } = {
      Sender: this.authService.user()!,
      Receiver: item.Join!
    }
    await this.chatService.startChatWithProfile(data);
  }

  // more
  async onMore(item: Subscription) {

  }

  // user profile
  onUser(user: User): void {
    this.userService.addUserProfile(user);
  }

  getProfileBackground(cloudflare: any) {
    return cloudflare.cloudflare.result.variants[0]
  }

  // scroll
  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  // return 
  goBack(): void {
    this.location.back();
  }

  // input class
  selectClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  inputClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return UIStyles.textareaClass(formGroup, controlName, height);
  }

  // button class
  buttonClass() {
    return UIStyles.buttonClass();
  }

  buttonSecondaryClass() {
    return UIStyles.buttonSecondaryClass();
  }
}
