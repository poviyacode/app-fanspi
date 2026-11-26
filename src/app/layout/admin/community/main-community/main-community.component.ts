import { Component, ComponentRef, effect, HostListener, inject, Input, OnInit, PLATFORM_ID, signal, ViewChild, ViewContainerRef, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser, isPlatformServer, Location } from '@angular/common';
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
  selector: 'app-main-community',
  imports: [
    CustomTranslatePipe,
    RouterModule,
    ReactiveFormsModule,
    IconDirective
  ],
  templateUrl: './main-community.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './main-community.component.scss'
})
export default class MainCommunityComponent {

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

  links = signal([
    { path: '/admin/community/subscriptions', title: 'subscriptions' },
    { path: '/admin/community/subscribers', title: 'subscribers' },
  ]);

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

      });
    }
  }

  onLinkClick(link: any) {
    this.router.navigate([link.path]); // Navegar al enlace seleccionado
  }

  // scroll
  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  // return 
  goBack(): void {
    this.location.back();
  }

}

