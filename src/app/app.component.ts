import {
  Component, inject, PLATFORM_ID, ViewChild, ViewContainerRef,
  signal, HostListener, OnInit, OnDestroy,
  ComponentRef,
  effect,
  untracked
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ApplicationRef, NgZone } from '@angular/core'; // Inyecciones clave para la estabilidad
import { filter, Subject, Subscription, takeUntil, timer } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '@services/auth.service';
import { ToolsService } from '@services/tools.service';
import { ToastService } from '@services/toast.service';
import { SpinnerService } from '@services/spinner.service';
import { DialogService } from '@services/dialog.service';
import { UserActivityService } from '@services/user-activity.service';
import { PushNotificationService } from '@services/push-notification/push-notitication.service';
import { NotificationService, TypeNotification } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { IconDirective } from '@directive/coin-svg.directive';
import KissmeComponent from '@shared/kissme/kissme.component';
import { SocketService } from '@services/socket.service';
import { ChatService } from '@services/chat.service';
import { Message } from '@interfaces/message';
import { Chat } from '@interfaces/chat';
import { MessageService } from '@services/message.service';
import { UserService } from '@services/user.service';
import { SoundService } from '@services/sound.service';
import { User, UserPermissions } from '@interfaces/user';
import { LiveStream } from '@interfaces/liveStream';
import { LiveStreamService } from '@services/live-stream.service';
import { CreditPurchaseComponent } from '@shared/credit-purchase/credit-purchase.component';
import CreatePostComponent from '@layout/agency/create/create-post/create-post.component';
import NotificationsComponent from '@shared/notifications/notifications.component';
import { JoinCallComponent } from '@shared/join-call/join-call.component';
import InviteBannerComponent from '@shared/invite-banner/invite-banner.component';
import { InteractionService } from '@services/interaction.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { UserCredit } from '@interfaces/transactionCredit';
import { TipComponent } from '@shared/tip/tip.component';
import { environment } from '@environments/environment';
import { LovenseSessionService } from '@services/lovense-session.service';
import { LovenseProductService } from '@services/lovense-product.service';
import { LovenseProduct } from '@interfaces/lovenseProduct';
import { MembershipService } from '@services/membership.service';
import { ModalLoginAuthComponent } from '@layout/auth/pages/modal-login-auth/modal-login-auth.component';
import P2pSearchingComponent from '@shared/p2p-searching/p2p-searching.component';
import { PaymentOrderService } from '@services/payment-order.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    IconDirective,
    KissmeComponent,
    CustomTranslatePipe
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {

  title = 'app-yuvinka';

  isStable = signal(false);
  isBrowser: boolean;
  isServer: boolean;

  isActive = signal(true);
  notificaciones: any[] = [];
  audio: HTMLAudioElement | null = null;

  // Bandera para garantizar que el socket solo se inicialice UNA vez por sesión
  private isSocketInitialized = false;

  // Subject para limpiar escuchas si alguna vez fuera estrictamente necesario (ej. logout forzoso)
  private reinitSocket$ = new Subject<void>();

  private activitySub!: Subscription;
  private authSub!: Subscription;

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();

  private visibilityListener?: () => void;
  private pageShowListener?: (event: PageTransitionEvent) => void;

  //component
  private creditPurchaseComponentRef: ComponentRef<CreditPurchaseComponent> | null = null;
  private notificationComponentRef: ComponentRef<NotificationsComponent> | null = null;
  private joinCallComponentRef: ComponentRef<JoinCallComponent> | null = null;
  private inviteBannerComponentRef: ComponentRef<InviteBannerComponent> | null = null;
  private tipComponentRef: ComponentRef<TipComponent> | null = null;
  private createPostComponentRef: ComponentRef<CreatePostComponent> | null = null;
  private modalLoginAuthComponentRef: ComponentRef<ModalLoginAuthComponent> | null = null;
  private p2pSearchingComponentRef: ComponentRef<P2pSearchingComponent> | null = null;

  // Inyecciones
  public authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  public toastService = inject(ToastService);
  public spinnerSevice = inject(SpinnerService);
  public dialogService = inject(DialogService);
  public toolsService = inject(ToolsService);
  private translate = inject(TranslateService);
  private userActivityService = inject(UserActivityService);
  private pushNotificationService = inject(PushNotificationService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private appRef = inject(ApplicationRef); // Controlar la estabilidad de la app
  private ngZone = inject(NgZone);         // Sacar procesos fuera de Zone.js
  private chatService = inject(ChatService);
  private messageService = inject(MessageService);
  private userService = inject(UserService);
  private soundService = inject(SoundService);
  private liveStreamService = inject(LiveStreamService);
  private interactionService = inject(InteractionService);
  private transactionCreditService = inject(TransactionCreditService);
  private lovenseSessionService = inject(LovenseSessionService);
  private lovenseProductService = inject(LovenseProductService);
  private paymentOrderService = inject(PaymentOrderService);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      effect(() => {
        const token = this.authService.token();

        untracked(() => {
          // CASO 1: El usuario tiene token Y el socket aún no se ha inicializado
          if (token && !this.isSocketInitialized) {
            this.isSocketInitialized = true; // 🔒 Bloqueamos futuras ejecuciones

            this.ngZone.runOutsideAngular(() => {
              timer(200)
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => {
                  this.userOnlineSocket();
                  this.onUserSuggestions();
                });
            });
          }
          // CASO 2: El usuario no tiene token (Logout)
          else if (!token && this.isSocketInitialized) {
            // 1. El usuario cerró sesión
            this.isSocketInitialized = false; // 🔄 Permitimos reinicialización en el futuro

            // 2. Matamos todas las escuchas (mensajes, créditos, etc.)
            this.reinitSocket$.next();

            // 3. Desconectamos el socket físicamente (si tu servicio lo permite)
            if (this.socketService.socket) {
              this.socketService.disconnect(); // <-- Asegúrate de que tu SocketService tenga este método
            }
          }

        });

        // Tu lógica de modales dinámicos
        const modalTarget = this.dialogService.activeModal$();
        if (modalTarget) {
          untracked(() => {
            this.handleDynamicModalOpen(modalTarget);
          });
        }
      });

    }
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.changeLangDefault();
    this.listenUserActivity();
    this.setupVisibilityListener();
  }

  ngOnDestroy(): void {

    if (!this.isBrowser) return;

    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }
    if (this.pageShowListener) {
      window.removeEventListener('pageshow', this.pageShowListener as EventListener);
    }

    // Limpieza absoluta de canales abiertos en memoria
    if (this.authSub) this.authSub.unsubscribe();
    if (this.activitySub) this.activitySub.unsubscribe();

    // Limpia todas las suscripciones del socket
    this.reinitSocket$.next();
    this.reinitSocket$.complete();

    this.destroy$.next();
    this.destroy$.complete();
  }

  private listenUserActivity(): void {
    this.activitySub = this.userActivityService.userActive$.subscribe(active => {
      this.ngZone.run(() => this.isActive.set(active));
    });
  }

  @HostListener('window:storage', ['$event'])
  handleStorageEvent(event: StorageEvent) {
    if (event.newValue === null) {
      this.ngZone.run(() => {
        this.router.navigate(['/auth']);
      });
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    if (environment.production) event.preventDefault();
  }

  private changeLangDefault() {
    const supportedLanguages = ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'pt_BR', 'ru', 'tr', 'zh'];
    let lang = 'en';

    const storedLang = localStorage.getItem('language');
    if (storedLang && supportedLanguages.includes(storedLang)) {
      lang = storedLang;
    } else {
      const browserLang = window.navigator.language.split('-')[0];
      if (supportedLanguages.includes(browserLang)) lang = browserLang;
    }

    this.translate.use(lang).subscribe(() => {
      this.toolsService.languageCreate(lang);
    });
  }

  eventNotification() {
    const eventPush = this.pushNotificationService.eventPushNotification();
    if (eventPush?.event === 'SEND') {
      if (eventPush.message.data.sound)

        this.notificationService.addNotification({
          ...eventPush.message.notification,
          timestamp: eventPush.message.notification.timestamp,
          type: eventPush.message.notification.type || TypeNotification.MESSAGE // ✅ AGREGAR TIPO
        });
    }
  }

  // suggestion
  async onUserSuggestions() {
    this.interactionService.resetUserSuggestions();
    const resUserSuggestions = await this.interactionService.getSuggestions();
    this.interactionService.addUserSuggestions(resUserSuggestions);
    this.onInviteBanner();
  }

  // sockets 
  private userOnlineSocket() {

    // 1. Limpieza preventiva: Si por alguna razón se llama de nuevo, mata las escuchas viejas primero
    this.reinitSocket$.next();
    this.reinitSocket$.complete();
    this.reinitSocket$ = new Subject<void>();

    if (!this.socketService.socket) {
      this.socketService.connect();
    }

    // USER SYNC
    this.socketService.onUserSync().pipe(
      filter(event => [
        'payment_order',
        'user',
      ].includes(event.entity)),
      takeUntil(this.reinitSocket$)
    ).subscribe(event => {
      const { entity, action, payload } = event;
      switch (entity) {
        case 'payment_order':
          const { PaymentOrder, Chat, TransactionCredit } = payload;
          if (action === 'acceptRequestP2P') {
            if (PaymentOrder) this.paymentOrderService.addP2pPaymentOrders(PaymentOrder);
            if (Chat) this.chatService.addChat(Chat);
            if (TransactionCredit) this.transactionCreditService.addBalanceTransactionCredit(TransactionCredit);
            this.clearP2pSearchingComponent();
            if (Chat?._id) this.router.navigate(['/chats/messages', Chat?._id]);

          } else if (action === 'createP2pRequest') {
            if (PaymentOrder) this.paymentOrderService.addP2pPaymentOrders(PaymentOrder);
            this.dialogService.toggleModal('p2pSearching');

          } else if (action === 'confirmP2pUserPayment') {
            if (PaymentOrder) this.paymentOrderService.addPaymentOrder(PaymentOrder);

          } else if (action === 'confirmP2pSenderReleasePayment') {
            if (PaymentOrder) this.paymentOrderService.addPaymentOrder(PaymentOrder);
            if (PaymentOrder?._id) this.router.navigate(['/admin/activity']);

          } else if (action === 'cancelP2pOrder') {
            if (PaymentOrder) this.paymentOrderService.addPaymentOrder(PaymentOrder);
            if (PaymentOrder?._id) this.router.navigate(['/admin/activity']);

          } else if (action === 'appealOrDisputeP2pOrder') {
            if (PaymentOrder) this.paymentOrderService.addPaymentOrder(PaymentOrder);
            if (PaymentOrder?._id) this.router.navigate(['/admin/activity']);
          }

          break;
        case 'user':
          if (action === 'findOneCurrent') {
            const { User: User, UserCredit: UserCredit, pushNotification, accountBalance } = payload;
            if (!User || this.authService.user()?._id !== User._id) return;
            this.userService.addUserCurrent(payload);
            this.authService.updateUser(User);

            if (accountBalance) {
              this.transactionCreditService.addBalanceTransactionCredit(accountBalance);
            }

            if (pushNotification) {
              this.pushNotificationService.addUserPushNotification(pushNotification);
            }
          } else if (action === 'UserCredit') {
            this.userService.updateUserCurrent({
              UserCredit: payload
            });

          } else if (action === 'ReceiveCustomSound') {
            const { soundUrl, soundName } = payload;
            if (soundUrl) {
              this.soundService.playCustomSound(soundUrl);

              this.notificationService.addNotification({
                title: '¡Sound!',
                body: `Sound received: ${soundName}`,
                type: TypeNotification.SOUND_RECEIVED,
                timestamp: Date.now()
              });
            }
          }
      }
    });

    // SYSTEM SYNC
    this.socketService.onSystemSync()
      .pipe(
        filter(event => [
          'payment_order'
        ].includes(event.entity)),
        takeUntil(this.reinitSocket$)
      ).subscribe(event => {
        const { entity, action, payload } = event;
        switch (entity) {
          case 'payment_order':
            if (action === 'p2pRequest') {
              const paymentOrder = payload;
              const user = paymentOrder.User;
              const image = user.Profile?.[0]?.cloudflare?.result?.variants?.[0] || '';
              const title = user.alias || user.username || 'Unknown user';
              const body = 'NEW PAYMENT ORDER';
              const timestamp = Number(user.onlineAt) || Number(new Date());

              this.notificationService.addNotification({
                icon: image,
                title,
                body,
                timestamp,
                _id: user._id,
                type: TypeNotification.P2P_REQUEST
              });
              this.onNotification();
            }
        }
      });

    // MESSAGE SYNC
    this.socketService
      .onNewMessage()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((data) => {
        const message: Message = data?.message;
        const chat = data?.chat;

        if (!message) return;

        // update chat
        const chatExist: Chat = this.chatService.chats().find(c => c!._id === chat._id)!;
        const updatedChat = { ...chat };

        if (chatExist) {

          // CORRECCIÓN CRUCIAL: Mantener los estados dinámicos 'online' y 'live' del frontend
          if (updatedChat.User && chatExist.User) {
            updatedChat.User.online = chatExist.User.online;
            updatedChat.User.live = chatExist.User.live;
            updatedChat.User.onlineAt = chatExist.User.onlineAt;
          }

          updatedChat.User.countCredit = updatedChat.User.countCredit || { current: 0 };
          updatedChat.User.countCredit.current = chatExist.User?.countCredit?.current || 0;

          this.chatService.updateChats(chat._id!, chat);
          this.sortChats();

        } else {
          const currentChats = this.chatService.chats();
          const updatedChats = [updatedChat, ...currentChats];
          this.chatService.addChats(updatedChats);
        }

        // count unread messages
        const receiverId = message.Receiver?._id || '';
        if (this.authService.user()?._id === receiverId) {
          const countUnreadMessages = this.authService.user()?.countUnreadMessages || 0;
          this.authService.updateUser({ countUnreadMessages: countUnreadMessages + 1 });
        }

        //push notification
        const image = message.Sender?.Profile?.[0]?.cloudflare?.result?.variants?.[0] || '';
        const title = message.Sender?.username || 'Unknown user';
        const body = message.message || '';
        const timestamp = Number(message.createdAt) || Number(new Date());

        this.notificationService.addNotification({
          icon: image,
          title,
          body,
          timestamp,
          type: TypeNotification.MESSAGE
        });

        this.onNotification();
      });

    this.socketService
      .onMessageSent()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((data) => {
        const message: Message = data?.message;
        const chat = data?.chat;

        if (!message || !chat) return;

        // update message
        const dataMessage = {
          ...message,
          Receiver: message.Receiver._id,
          Sender: message.Sender._id
        };
        this.messageService.updateMessages(message.code!, dataMessage);

        // update chat
        const chatExist: Chat = this.chatService.chats().find(c => c!._id === chat._id)!;

        const updatedLastMessage = {
          ...message,
          Sender: this.authService.user()!._id
        };

        if (chatExist) {
          const dataUpdateChat: Chat = {
            ...chatExist,
            lastMessageAt: `${message.createdAt || new Date()}`,
            LastMessage: updatedLastMessage
          };

          this.chatService.updateChats(chat._id!, dataUpdateChat);
          this.sortChats();

        } else {
          const updatedChat = {
            ...chat,
            LastMessage: updatedLastMessage
          };
          const currentChats = this.chatService.chats();
          const updatedChats = [updatedChat, ...currentChats];
          this.chatService.addChats(updatedChats);
        }
      });

    this.socketService.onMessageRead2()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((data) => {
        const { chat } = data;
        // update chat
        const chatExist: Chat = this.chatService.chats().find(chat => chat!._id === chat._id)!;
        if (chatExist) {
          const updatedLastMessage = {
            ...chatExist.LastMessage,
            status: 'READ'
          };
          const dataUpdateChat: Chat = {
            ...chatExist,
            lastMessageAt: `${chat.updatedAt || new Date()}`,
            LastMessage: updatedLastMessage
          };

          this.chatService.updateChats(chat._id!, dataUpdateChat);
          this.sortChats();
        }
      });

    this.socketService
      .onMessageDeleted()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((data) => {
        const { deletedMessage, chat, unreadCount } = data;
        if (!data) return;

        // update chat
        const chatExist: Chat = this.chatService.chats().find(chat => chat!._id === chat._id)!;

        if (chatExist) {
          this.chatService.updateChats(chat._id!, chat);
          this.sortChats();

        } else {
          if (this.authService.user()! && chat.Sender && chat.Sender!._id == this.authService.user()!._id) {
            chat.User = chat.Receiver;
          } else if (this.authService.user()! && chat.Receiver && chat.Receiver!._id == this.authService.user()!._id) {
            chat.User = chat.Sender;
          }

          const currentChats = this.chatService.chats();
          const updatedChats = [chat, ...currentChats];
          this.chatService.addChats(updatedChats);
        }
      });

    this.socketService
      .onInitialOnlineUsers()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((onlineUsers: any[]) => {
        console.log('users online: ', onlineUsers.length)
        //+++ chat
        if (!onlineUsers || !Array.isArray(onlineUsers)) return;

        // Mapeo preventivo: Nos aseguramos de que todos lleven online: true si vienen en esta lista inicial
        const mappedOnlineUsers = onlineUsers.map((u: any) => ({ ...u, online: true }));
        this.userService.addUsersOnline(mappedOnlineUsers);

        this.handleOnlineUsers();

      });

    this.socketService
      .onUserOnlineStatus()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((user: User) => {
        if (!user) return;

        // Si viene con online: false -> addUsersOnline se encargará de eliminarlo automáticamente.
        this.userService.updateSingleUserOnlineStatus(user);

        // Buscamos el chat que pertenece a este usuario que cambió su estado
        const chat = this.chatService.chats().find(item =>
          item.Sender?._id === user._id || item.Receiver?._id === user._id || item.User?._id === user._id
        );

        if (chat) {
          // Actualizamos el estado tanto en el objeto User genérico como en las subpropiedades
          if (chat.User && chat.User._id === user._id) chat.User.online = user.online;
          if (chat.User && chat.User._id === user._id) chat.User.live = user.live;
          if (chat.Sender && chat.Sender._id === user._id) chat.Sender.online = user.online;
          if (chat.Receiver && chat.Receiver._id === user._id) chat.Receiver.online = user.online;

          this.chatService.updateChats(chat._id!, chat);
        }

        // users profile 
        const currentItems = this.userService.usersProfile();
        const poToUpdate = currentItems.find((item) => item._id === user._id);

        if (poToUpdate) {
          this.userService.updateUsersProfile(user._id!, { ...user });
        } else {
          const updatedItems = [user, ...currentItems.filter(item => item._id !== user._id)];
          this.userService.addUsersProfile(updatedItems);
        }

        const data: any = {};

        if (user.live !== undefined) data.live = user.live;
        if (user.online !== undefined) data.online = user.online;
        if (user.onlineAt !== undefined) data.onlineAt = user.onlineAt;

        // Re-armamos la lista definitiva libre de fantasmas
        const currentUsersMap = new Map(this.userService.usersProfile().map(item => [item._id, item]));
        let finalItems: any = Array.from(currentUsersMap.values());

        // Ordenamiento multi-criterio: LIVE primero, luego ONLINE, luego el resto
        finalItems.sort((a: any, b: any) => {
          const isALive = a.live === true || String(a.live) === 'true';
          const isBLive = b.live === true || String(b.live) === 'true';
          const isAOnline = a.online === true || String(a.online) === 'true';
          const isBOnline = b.online === true || String(b.online) === 'true';

          if (isALive !== isBLive) return isALive ? -1 : 1;
          if (isAOnline !== isBOnline) return isAOnline ? -1 : 1;
          return 0;
        });

        // Guardamos la lista purgada y ordenada en el estado global de tu Angular 22
        this.userService.addUsersProfile(finalItems);

        // Removemos el usuario si está offline y no tiene perfil
        const currentItemsProfile = this.userService.usersProfile();
        const poToUpdateProfile = currentItemsProfile.find((item) => item._id === user._id);
        if (poToUpdateProfile?.online === false && (!poToUpdateProfile!.Profile || poToUpdateProfile!.Profile.length === 0)) {
          this.userService.removeUsersProfile(user._id!);
        }

        // message 
        const messageReceiverId = this.messageService.userReceiver()?._id;

        if (messageReceiverId === user._id) {
          if (Object.keys(data).length > 0) {
            this.messageService.updateUserReceiver(data);
          }
        }

        // user profile
        const userProfileId = this.userService.userProfile()?._id;
        if (userProfileId === user._id) {
          if (Object.keys(data).length > 0) {
            this.userService.updateUserProfile(data);
          }
        }

        // push notification
        if (user.online) {
          const image = user.Profile?.[0]?.cloudflare?.result?.variants?.[0] || '';
          const title = user.alias || user.username || 'Unknown user';
          const body = 'ONLINE';
          const timestamp = Number(user.onlineAt) || Number(new Date());

          this.notificationService.addNotification({
            icon: image,
            title,
            body,
            timestamp,
            _id: user._id,
            type: TypeNotification.ONLINE
          });
          this.onNotification();
        }
      });

    this.socketService
      .onLiveStreamStatus()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((liveStream: LiveStream) => {
        if (!liveStream) return;

        // const user = liveStream.User!;
        // console.log('✅ Live Stream Status:', user);
        // const currentItems = this.userService.usersProfile();
        // const poToUpdate = currentItems.find((item) => item._id === user._id);

        // if (poToUpdate) {
        //   console.log('poToUpdate', user.live);
        //   poToUpdate.live = user.live;
        //   this.userService.updateUsersProfile(user._id!, { live: user.live });
        // }

      });

    this.socketService
      .onIncomingCall()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((liveStream: LiveStream) => {
        this.liveStreamService.addLiveStream(liveStream);
        this.onJoinCall();
      });

    this.socketService
      .onCreditUpdate()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((payload: UserCredit) => {
        if (payload) {
          this.userService.updateUserCurrent({ UserCredit: payload });
          if (this.userService.userCurrent()?.UserCredit?.current! <= 0) {
            this.onCreditPurchase();
          }
        }
      });

    this.socketService.onNotifyReceiveNotification()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((notification: any) => {
        console.log('notification', notification);
        if (notification) {
          const _id: string = notification._id || '';
          const image: string = notification.icon || '';
          const title: string = notification.title || '';
          const body: string = notification.body || '';
          const timestamp: number = Number(notification.timestamp) || Number(new Date());
          const type = notification.type || TypeNotification.ONLINE
          this.notificationService.addNotification({
            _id,
            icon: image,
            title,
            body,
            timestamp,
            type
          });
          this.onNotification();
        }
      });

    // lovense 
    this.socketService
      .onLovenseDeviceConnectedStatus()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((lovense: any) => {
        const { status, session, message } = lovense;
        const products: LovenseProduct[] = lovense.products || [];

        this.lovenseSessionService.resetLovenseSession();
        this.lovenseSessionService.addLovenseSession(session);

        this.lovenseProductService.resetLovenseProducts();
        this.lovenseProductService.addLovenseProducts(products);
      });

    this.socketService
      .onSocketTest()
      .pipe(takeUntil(this.reinitSocket$))
      .subscribe((data) => {
      });

    this.socketService.socket.emit('request_initial_user_current');

    // SYNC PERIÓDICO CONTROLADO (Polling cada 45 segundos fuera de Zone.js)
    this.ngZone.runOutsideAngular(() => {
      timer(5000, 120000) // Se ejecuta al inicio en 10 segundos y luego cada 2 minutos
        .pipe(takeUntil(this.reinitSocket$))
        .subscribe(() => {
          // Solo solicita si la pestaña actual está activa en el navegador
          if (typeof document !== 'undefined' && !document.hidden && this.socketService.socket?.connected) {
            this.socketService.socket.emit('request_initial_online_users');
          }
        });
    });
  }

  detachSocketEvents() {
    if (this.socketService.socket) {
    }
  }

  private setupVisibilityListener(): void {
    if (!this.isBrowser) return;

    this.visibilityListener = () => {
      if (!document.hidden) {
        this.triggerOnlineUsersSync();
      }
    };

    this.pageShowListener = (event: PageTransitionEvent) => {
      if (event.persisted) {
        this.triggerOnlineUsersSync();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityListener);
    window.addEventListener('pageshow', this.pageShowListener as EventListener);
  }

  private triggerOnlineUsersSync(): void {
    // Verificamos que exista el socket y esté conectado físicamente
    if (this.socketService.socket?.connected) {
      //this.socketService.socket.emit('request_initial_online_users');

      // Opcional: Si también quieres asegurarte de refrescar los datos del usuario actual al volver
      this.socketService.socket.emit('request_initial_user_current');
    }
  }

  handleOnlineUsers() {
    const onlineUsers: User[] = this.userService.usersOnline();
    // Mapeamos los chats cargados por HTTP
    this.chatService.chats().forEach(chat => {
      if (chat.User) {
        // Buscamos si el ID del chat existe dentro de los objetos del array del socket
        const isOnline = onlineUsers.some(u => {
          // Asegúrate de usar la propiedad correcta del backend (ej: u._id o u.id)
          const socketUserId = u._id;
          return socketUserId === chat.User!._id;
        });

        if (isOnline) {
          chat.User.online = true;
          this.chatService.updateChats(chat._id!, chat);
        }
      }
    });

    //+++ message
    const receiverId = this.messageService.userReceiver()?._id;

    if (receiverId && Array.isArray(onlineUsers)) {
      const amIOnline = onlineUsers.some((user: any) => user._id === receiverId);

      if (amIOnline) {
        this.messageService.updateUserReceiver({ online: true });
      }
    }

    // ==========================================
    // 3. SINCRONIZACIÓN DE PERFILES DE USUARIOS (usersProfile)
    // ==========================================
    let currentItems = [...(this.userService.usersProfile() || [])];

    // CASO VACÍO: Si el socket dice que no hay nadie online, reseteamos a todos de golpe
    if (!onlineUsers || onlineUsers.length === 0) {
      const updatedItems: any = currentItems.map(user => ({
        ...user,
        online: false,
        liveRoomId: null
      }));
      this.userService.addUsersProfile(updatedItems);
      return;
    }

    // 💡 SOLUCIÓN MAESTRA AL PROBLEMA DE DESFASE:
    // Creamos el mapa pero seteando preventivamente a todos los que ya tenemos en ONLINE: FALSE y LIVE: FALSE.
    // De esta manera, si alguien se desconectó, su estado se limpia automáticamente aquí.
    const currentUsersMap = new Map(
      currentItems.map(user => [
        user._id,
        { ...user, online: false, liveRoomId: null }
      ])
    );

    // Procesamos los usuarios frescos que vienen de la lista del Socket
    onlineUsers.forEach(incomingUser => {
      if (currentUsersMap.has(incomingUser._id)) {
        // --- SI YA EXISTÍA EN RAM: Mantenemos sus propiedades locales pero actualizamos los flags del Socket ---
        const existingUser = currentUsersMap.get(incomingUser._id)!;

        const updatedUser: any = {
          ...existingUser,
          ...incomingUser, // Copia los datos más frescos del servidor (como foto, username, liveRoomId)
          online: true,    // Forzamos que este sí está activo
        };

        currentUsersMap.set(incomingUser._id, updatedUser);
        this.userService.updateUsersProfile(incomingUser._id!, updatedUser);

      } else {
        // --- SI ES NUEVO: Lo agregamos directamente con sus datos de red ---
        const newUser: any = {
          ...incomingUser,
          online: true,
        };

        currentUsersMap.set(newUser._id, newUser);
        this.userService.updateUsersProfile(newUser._id!, newUser);
      }
    });

    // Re-armamos la lista definitiva libre de fantasmas
    let finalItems: any = Array.from(currentUsersMap.values());

    // Ordenamiento multi-criterio: LIVE primero, luego ONLINE, luego el resto
    finalItems.sort((a: any, b: any) => {
      const isALive = a.live === true || String(a.live) === 'true';
      const isBLive = b.live === true || String(b.live) === 'true';
      const isAOnline = a.online === true || String(a.online) === 'true';
      const isBOnline = b.online === true || String(b.online) === 'true';

      if (isALive !== isBLive) return isALive ? -1 : 1;
      if (isAOnline !== isBOnline) return isAOnline ? -1 : 1;
      return 0;
    });

    // Guardamos la lista purgada y ordenada en el estado global de tu Angular 22
    this.userService.addUsersProfile(finalItems);

    // user profile
    const userProfileId = this.userService.userProfile()?._id;
    if (userProfileId && Array.isArray(onlineUsers)) {
      const amIOnline = onlineUsers.some(user => user._id === userProfileId);

      if (amIOnline) {
        this.userService.updateUserProfile({ online: true });
      }
    }
  }

  sortChats() {
    this.chatService.chats().sort((a, b) => {
      const fechaA = new Date(a.lastMessageAt!);
      const fechaB = new Date(b.lastMessageAt!);
      return fechaB.getTime() - fechaA.getTime();
    });

    const currentChats = this.chatService.chats();
    const updatedChats = [...currentChats];
    this.chatService.addChats(updatedChats);
  }

  private handleDynamicModalOpen(modal: string) {
    // 1. Abrimos el contenedor visual usando tu método existente
    //this.dialogService.toggleModal(modal);
    // 2. Renderizamos el componente dinámico correspondiente
    switch (modal) {
      case 'creditPurchase':
        this.onCreditPurchase();
        break;
      case 'inviteBanner':
        this.onInviteBanner();
        break;
      case 'notification':
        this.onNotification();
        break;
      case 'modalRequestJoinCall':
        this.onJoinCall();
        break;
      case 'tipCredit':
        this.onTipModal();
        break;
      case 'createPost':
        this.onCreatePostModal();
        break;
      case 'p2pSearching':
        this.onP2pSearchingModal();
        break;
      case 'login':
        this.onLoginModal();
        break;
    }
  }

  //components
  onCreditPurchase() {
    this.clearCreditPurchaseComponent();
    const componentRef = this.viewContainerRef.createComponent(CreditPurchaseComponent);
    this.creditPurchaseComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearCreditPurchaseComponent(); // Destruye el componente hijo
      console.log('close onCreditPurchase');
      this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    //this.dialogService.toggleModal('creditPurchase');
  }

  private clearCreditPurchaseComponent() {
    if (this.creditPurchaseComponentRef) {
      this.creditPurchaseComponentRef.destroy();
      this.creditPurchaseComponentRef = null;
    }
  }

  onInviteBanner() {

    this.clearInviteBannerComponent();
    const componentRef = this.viewContainerRef.createComponent(InviteBannerComponent);
    this.inviteBannerComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearInviteBannerComponent();
      //this.dialogService.closeModal();
    });
    //this.dialogService.toggleModal('inviteBanner');
  }

  private clearInviteBannerComponent() {
    if (this.inviteBannerComponentRef) {
      this.inviteBannerComponentRef.destroy();
      this.inviteBannerComponentRef = null;
    }
  }

  onNotification() {


    this.clearNotificationComponent();
    const componentRef = this.viewContainerRef.createComponent(NotificationsComponent);
    this.notificationComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      console.log('closeNotification');
      this.clearNotificationComponent();
      //this.dialogService.closeModal();
    });
    //this.dialogService.toggleModal('notification');
  }

  private clearNotificationComponent() {
    if (this.notificationComponentRef) {
      this.notificationComponentRef.destroy();
      this.notificationComponentRef = null;
    }
  }

  onJoinCall() {
    this.clearJoinCallComponent();
    const componentRef = this.viewContainerRef.createComponent(JoinCallComponent);
    this.joinCallComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearJoinCallComponent();
      //this.dialogService.closeModal();
    });
    // this.dialogService.toggleModal('modalRequestJoinCall');
  }

  private clearJoinCallComponent() {
    if (this.joinCallComponentRef) {
      this.joinCallComponentRef.destroy();
      this.joinCallComponentRef = null;
    }
  }

  onCreatePostModal() {

    this.clearCreatePostComponent();

    const componentRef = this.viewContainerRef.createComponent(CreatePostComponent);
    this.createPostComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearCreatePostComponent(); // Destruye el componente hijo
      this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    this.dialogService.toggleModal('createPost');
  }

  private clearCreatePostComponent() {
    if (this.createPostComponentRef) {
      this.createPostComponentRef.destroy();
      this.createPostComponentRef = null;
    }
  }

  onTipModal() {
    this.clearTipComponent();
    const componentRef = this.viewContainerRef.createComponent(TipComponent);
    this.tipComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearTipComponent(); // Destruye el componente hijo
      console.log('close tipModal');
      this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    //this.dialogService.toggleModal('tipCredit');
  }

  private clearTipComponent() {
    if (this.tipComponentRef) {
      this.tipComponentRef.destroy();
      this.tipComponentRef = null;
    }
  }

  onLoginModal() {
    this.clearModalLoginAuthComponent();
    const componentRef = this.viewContainerRef.createComponent(ModalLoginAuthComponent);
    this.modalLoginAuthComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearModalLoginAuthComponent(); // Destruye el componente hijo
      this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    this.dialogService.toggleModal('login');
  }

  private clearModalLoginAuthComponent() {
    if (this.modalLoginAuthComponentRef) {
      this.modalLoginAuthComponentRef.destroy();
      this.modalLoginAuthComponentRef = null;
    }
  }

  onP2pSearchingModal() {
    this.clearP2pSearchingComponent();
    const componentRef = this.viewContainerRef.createComponent(P2pSearchingComponent);
    this.p2pSearchingComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearP2pSearchingComponent(); // Destruye el componente hijo
      console.log('close P2pSearchingModal');
      this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    this.dialogService.toggleModal('P2pSearching');
  }

  private clearP2pSearchingComponent() {
    if (this.p2pSearchingComponentRef) {
      this.p2pSearchingComponentRef.destroy();
      this.p2pSearchingComponentRef = null;
    }
  }
}