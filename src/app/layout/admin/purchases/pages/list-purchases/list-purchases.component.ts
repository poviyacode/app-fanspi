import { CommonModule, isPlatformBrowser, isPlatformServer, Location } from '@angular/common';
import { ApplicationRef, Component, ComponentRef, effect, HostListener, inject, Inject, OnInit, PLATFORM_ID, signal, ViewChild, ViewContainerRef, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { environment } from '@environments/environment';
import { User } from '@interfaces/user';
import { Post } from '@interfaces/post';
import { UserService } from '@services/user.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { first, Subject, takeUntil } from 'rxjs';
import { Subscription } from '@interfaces/subscription';
import { DialogService } from '@services/dialog.service';
import { ToastService } from '@services/toast.service';
import { SpinnerService } from '@services/spinner.service';
import { AuthService } from '@services/auth.service';
import { ChatService } from '@services/chat.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CountryService } from '@services/country.service';
import { Country } from '@interfaces/country';
import { UIStyles } from '@core/common/uistyles';
import { MessageService } from '@services/message.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import { SubscriptionService } from '@services/subscription.service';
import { CreditPurchaseComponent } from '@shared/credit-purchase/credit-purchase.component';
import { ToolsService } from '@services/tools.service';

@Component({
  selector: 'app-list-purchases',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    IconDirective,
    TruncatePipe,
    DateAgoPipe
  ],
  templateUrl: './list-purchases.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./list-purchases.component.scss']
})
export default class ListPurchasesComponent {

  isBrowser: boolean;
  isServer: boolean;

  totalPages: number = 0;
  currentPage = 0;
  limitPage = 9;
  hasMore: boolean = true;
  loading = signal(false);

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  // components
  private creditPurchaseComponentRef: ComponentRef<CreditPurchaseComponent> | null = null;

  private destroy$ = new Subject<void>();

  myForm: FormGroup;
  search: string | null;
  url: string = 'active';
  count: any;

  public router = inject(Router);
  public userService = inject(UserService);
  private document = inject(DOCUMENT);
  private dialogService = inject(DialogService);
  public authService = inject(AuthService);
  public countryService = inject(CountryService);
  private platformId = inject(PLATFORM_ID);
  private applicationRef = inject(ApplicationRef);
  public messageService = inject(MessageService);
  public transactionCreditService = inject(TransactionCreditService);
  private location = inject(Location);
  private activatedRoute = inject(ActivatedRoute);
  private subscriptionService = inject(SubscriptionService);
  private toolsService = inject(ToolsService);

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    if (this.isBrowser) {

      this.activatedRoute.paramMap.subscribe((params) => {
        this.url = params.get('status') || 'active';

        this.currentPage = 0;
        this.hasMore = true;
        this.transactionCreditService.resetTransactionCredits();
        //this.monitorAppStability();
        this.init();
      });

    }
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // reset
    this.transactionCreditService.resetTransactionCredits();
  }

  async monitorAppStability() {
    this.applicationRef.isStable.pipe(
      first(isStable => isStable)
    ).subscribe(async () => {
      if (this.authService.user()!) {
        this.init();
      }
    });
  }

  async init() {
    await Promise.all([
      this.findAllUser(),
    ])
  }

  async findAllUser() {

    if (!this.hasMore) return;
    this.loading.set(true);

    const data = {
      status: this.url === 'active' ? 'ACCEPT' : 'DECLINE',
    };

    this.transactionCreditService
      .paymentsTransactionUser(data, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {

          if (res) {

            if (this.currentPage === 0) {
              this.count = {
                accept: res.accept,
                decline: res.decline
              };
              this.totalPages = res.total;
            }

            const currents = this.transactionCreditService.transactionCredits();
            const news = res.data.filter((newPost: Post) => {
              return !currents.some(existingPost => existingPost._id === newPost._id);
            });
            const updateds = [...currents, ...news];
            this.transactionCreditService.addTransactionCredits(updateds);

            this.hasMore = this.currentPage <= this.totalPages;

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
        this.findAllUser();
      }
    }
  }

  // search 
  onSearch(): void {

    this.loading.set(true);

    this.hasMore = true;
    this.totalPages = 0;
    this.currentPage = 0;
    this.userService.resetUsersProfile();
    this.findAllUser();
  }

  logout() {
    this.dialogService.closeModal();
    this.subscriptionService.resetSubscribersUserJoin();
    this.authService.logout();
  }

  onUser(user: User): void {
    this.userService.addUserProfile(user);
  }

  getBackgroundImageUrl(item: any, type: string): string {
    if (item.Cover && item.Cover.length > 0) {
      const cover = item.Cover[0];
      if (type === 'image') {
        if (cover.cloudflare && cover.cloudflare.result.variants[0]) {
          return cover.cloudflare.result.variants[0];
        } else if (cover.url) {
          return cover.url;
        }
      } else if (type === 'video') {
        if (cover.cloudflare && cover.cloudflare.result.thumbnail) {
          return `https://customer-6kruyx7h361tmu11.cloudflarestream.com/${cover.cloudflare.result.thumbnail}`;
        } else if (cover.url) {
          return cover.url;
        }
      }
    }
    return '';
  }

  isType(item: any, type: string): boolean {
    return item.Cover && item.Cover.length > 0 && item.Cover[0].type === type;
  }

  hasCover(item: any): boolean {
    return item.Cover && item.Cover.length > 0;
  }

  openCreditPurchase(): void {
    this.dialogService.toggleModal('creditPurchase');
  }

  // select row index table
  selectedRowIndex: number | null = null;

  onRowClick(index: number): void {
    if (this.selectedRowIndex === index) {
      //this.selectedRowIndex = null; // Deselect if clicked again
    } else {
      this.selectedRowIndex = index;
    }
  }

  getFirstLetter(name: string): string {
    return this.toolsService.getFirstLetter(name);
  }

  // scroll
  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  goBack(): void {
    this.location.back();
  }

  // button class
  buttonClass() {
    return UIStyles.buttonClass();
  }
}
