import { ApplicationRef, Component, ComponentRef, computed, effect, HostListener, Inject, inject, Input, PLATFORM_ID, signal, ViewChild, ViewContainerRef, WritableSignal, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AuthService } from '@services/auth.service';
import { SocketService } from '@services/socket.service';
import { ToolsService } from '@services/tools.service';
import { UserService } from '@services/user.service';
import { PostService } from '@services/post.service';
import { SubscriptionService } from '@services/subscription.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterLinkWithHref, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser, isPlatformServer, NgOptimizedImage } from '@angular/common';
import { CounterService } from '@services/counter.service';
import { DialogService } from '@services/dialog.service';
import { CreditPurchaseComponent } from '../credit-purchase/credit-purchase.component';
import { MenuSidebar } from '@interfaces/menuSidebar';
import CreatePostComponent from '@layout/agency/create/create-post/create-post.component';
import { filter, first, interval, Observable, Subject, Subscription, switchMap, takeUntil, tap, timer } from 'rxjs';
import { environment } from '@environments/environment';
import { SpinnerService } from '@services/spinner.service';
import { User, UserPermissions } from '@interfaces/user';
import { UIStyles } from '@core/common/uistyles';
import { IconDirective } from '@directive/coin-svg.directive';
import { FollowService } from '@services/follow.service';
import { PushNotificationService } from '@services/push-notification/push-notitication.service';
import { SwPush } from '@angular/service-worker';
import { BrowserIdService } from '@services/browser-id.service';
import { ToastService } from '@services/toast.service';
import { NotificationService } from '@services/notification.service';
import CreateAdComponent from '@layout/agency/create/create-ad/create-ad.component';
import { SiteService } from '@services/site.service';
import { Site } from '@interfaces/site';
import { MessageService } from '@services/message.service';
import InviteBannerComponent from '@shared/invite-banner/invite-banner.component';
import { InteractionService } from '@services/interaction.service';
import { Message } from '@interfaces/message';
import { ChatService } from '@services/chat.service';
import { Chat } from '@interfaces/chat';
import NotificationsComponent from '@shared/notifications/notifications.component';
import { JoinCallComponent } from '@shared/join-call/join-call.component';
import { LiveStreamService } from '@services/live-stream.service';
import { LiveStream } from '@interfaces/liveStream';
import { UserCredit } from '@interfaces/transactionCredit';
import { PostMediaDetails } from '@interfaces/postMedia';
import { PostMediaService } from '@services/post-media.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { TokenService } from '@services/token.service';
import { WebNotificationService } from '@services/push-notification/web-notitication.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'sidebar',
  imports: [
    RouterLinkWithHref,
    CustomTranslatePipe,
    RouterOutlet,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    IconDirective,
    CommonModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: []
})
export default class SidebarComponent {

  isBrowser: boolean;
  isServer: boolean;

  public getScreenWidth: any;
  public getScreenHeight: any;
  openMobil = signal(false);
  openSidebar: boolean = true;
  menuSidebar: MenuSidebar[] = [];
  menuSidebarModal: MenuSidebar[] = [];
  countryCurrentIso: string | null;
  userCredit: UserCredit | null;
  username: WritableSignal<string | undefined> = signal<string | undefined>(undefined);
  hasLiveContent: boolean;
  langs: any[] = [
    { value: 'en', name: 'English' },
    { value: 'es', name: 'Español' },
    { value: 'pt_BR', name: 'Portugués' },
    { value: 'fr', name: 'Français' },
    { value: 'it', name: 'Italiano' },
    { value: 'de', name: 'Deutsch' },
    { value: 'ja', name: '日本語' },
    { value: 'ko', name: '한국어' },
    { value: 'ru', name: 'Pусский' },
    { value: 'tr', name: 'Türkçe' },
    { value: 'zh', name: '中文' },
  ];
  myformLanguage: FormGroup;
  userCreditData: UserCredit;
  currentRoute: string | null = null;

  permissions: UserPermissions | null = null;

  // notification
  subscription = signal<PushSubscription | null>(null);
  audio: HTMLAudioElement | null = null;

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef: ViewContainerRef;
  private destroy$ = new Subject<void>();

  public counterService = inject(CounterService);
  public authService = inject(AuthService);
  public dialogService = inject(DialogService);
  public toolsService = inject(ToolsService);
  public router = inject(Router);
  public userService = inject(UserService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  public socketService = inject(SocketService);
  private postService = inject(PostService);
  private subscriptionService = inject(SubscriptionService);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private spinnerService = inject(SpinnerService);
  private followService = inject(FollowService);
  private webNotificationService = inject(WebNotificationService);
  private swPush = inject(SwPush);
  private browserIdService = inject(BrowserIdService);
  private toastService = inject(ToastService);
  private notificationService = inject(NotificationService);
  private siteService = inject(SiteService);
  private messageService = inject(MessageService);
  private interactionService = inject(InteractionService);
  private chatService = inject(ChatService);
  private liveStreamService = inject(LiveStreamService);
  private postMediaService = inject(PostMediaService);
  public transactionCreditService = inject(TransactionCreditService);
  private tokenService = inject(TokenService);
  private pushNotificationService = inject(PushNotificationService);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    this.spinnerService.close();

    if (this.isBrowser) {
      this.countryCurrentIso = this.toolsService.countryCurrent ? `/${this.toolsService.countryCurrent}` : '/';

      effect(() => {
        this.permissions = this.userService.permissions();
      });

      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          takeUntil(this.destroy$)
        )
        .subscribe((event: NavigationEnd) => {
          const urlSegments = event.urlAfterRedirects.split('/');
          this.currentRoute = urlSegments.includes('messages') || urlSegments.includes('live') ? 'messages' : null;
          if (this.currentRoute) {
            this.toolsService.addHeadMobil(false);
          } else {
            this.toolsService.addHeadMobil(true);
          }
        });
    }
  }

  ngOnInit() {
    if (this.isBrowser) {
      let lang = this.toolsService.language() || window.navigator.language.split('-')[0];
      this.myformLanguage = this.fb.group({ language: [lang, Validators.required] });

      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
      this.onWindowResize();

      if (this.authService.user()) {
        if (!this.authService.user()?.Profile?.length) {
          this.router.navigate(['/admin/profile']);
        }

        // 30000 ms = 30 segundos de retraso exactos tras cargar la app
        timer(60000)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.getPushNotification();
          });
      }
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.destroy$.next();
      this.destroy$.complete();
    }
  }

  onMenuSiberDialog() {
    this.dialogService.toggleModal('sidebar');
  }

  onCloseModal() {
    this.dialogService.closeModal();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    this.openMobil.set(this.getScreenWidth <= 640);
    this.openSidebar = this.getScreenWidth >= 1100;
  }

  logout() {
    this.dialogService.closeModal();
    this.dialogService.closeModal();
    this.subscriptionService.resetSubscribersUserJoin();

    this.authService.logout();

  }

  async redirectToSite() {
    try {
      const username = this.authService.user()?.username;
      if (!username) {
        console.warn('No se encontró el nombre de usuario para la redirección.');
        return;
      }

      const data = {
        siteAfter: 'exitada',
        siteCurrent: 'yuvinka',
        production: environment.production,
      };

      this.spinnerService.start();

      const response = await this.siteService.findSiteRedirect(data);

      if (!response || !response.token || !response.SiteAfter) {
        throw new Error('La respuesta del servidor no contiene los datos de redirección válidos.');
      }

      const { token, SiteAfter } = response;

      const redirectUrl = `${SiteAfter.domain}/token-login?token=${token.token}&route=${username}`;
      this.logout();
      window.open(redirectUrl, '_parent', 'noopener,noreferrer');

    } catch (error) {
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
    } finally {
      this.spinnerService.close();
    }
  }

  // live
  async onStartLiveStream() {

    const user = this.authService.user()!;
    if (user.status === 'SUSPENDED') {
      this.router.navigateByUrl(`/${user.username}`);
      return;
    }

    if (!this.permissions?.canGoLive) {
      this.dialogService.toggleModal('creditPurchase');
      return;
    }

    const data = {
      transmissionType: 'STREAMING',
      live: true
    };

    this.spinnerService.start();
    this.liveStreamService.handleLiveStreamStatus(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.router.navigateByUrl(`/live/${user.username}`);
          }
          this.spinnerService.close();
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        }
      });
  }

  // create post
  onCreatePost() {

    if (!this.permissions?.canCreatePosts) {
      this.dialogService.toggleModal('creditPurchase');
      return;
    }

    this.postService.resetPost();
    this.dialogService.toggleModal('createPost');
  }

  onCreditPurchase(): void {
    this.onCloseModal();
    this.dialogService.toggleModal('creditPurchase');
  }

  onUser(): void {
    this.dialogService.closeModal();
    this.onScrollTop();
    this.userService.addUserProfile(this.authService.user()!);
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  // socket 
  get socketStatus() {
    return this.socketService.socketStatus();
  }

  socketConnect() {
    this.socketService.socketStatus() ? this.socketService.disconnect() : this.socketService.connect();
  }

  connect() {
    this.socketService.connect();
  }

  disconnect() {
    this.socketService.disconnect();
  }

  // lang
  changeLang(lang: string) {
    this.translate.use(lang).subscribe({
      next: () => {
        this.toolsService.languageCreate(lang);
      },
      error: (err) => {

      }
    });
  }

  // scroll
  onScrollTop() {
    this.document.documentElement.scrollTop = 0;
  }


  getFirstLetter(name: string): string {
    return this.toolsService.getFirstLetter(name);
  }

  // notification
  async getPushNotification() {
    if (this.authService.user() && this.currentRoute !== 'admin' && environment.production) {
      await this.requestPermission();
    }
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {

        this.swPush.requestSubscription({
          serverPublicKey: environment.publicKey,
        }).then(subscription => {

          this.subscription.set(subscription);

          if (!this.subscription) {
            return;
          }

          this.createNotification();

        }).catch(err => {

        });

      }

    } catch (error) {

    }
  }

  async createNotification() {

    if (!this.subscription()) {
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
      return;
    }

    const subscription = this.subscription();
    const deviceInfo = await this.browserIdService.getFullDeviceInfo()!;

    const data = {
      token: subscription,
      ...deviceInfo
    };

    this.webNotificationService.create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {

          if (res && res.User === this.authService.user()?._id) {
            this.pushNotificationService.updateUserPushNotification({ webpush: res });
          }
        },
        error: (err) => {
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.toastService.start({ type: 'success', message: 'notificationEnabled' });
        }
      });
  }

  // user image
  getMediaDetails(item: any): PostMediaDetails | null {
    return this.postMediaService.getBackgroundImageUrl(item);
  }


  // class
  buttonClass() {
    return UIStyles.buttonClass();
  }

  buttonSecondaryClass() {
    return UIStyles.buttonSecondaryClass();
  }


}
