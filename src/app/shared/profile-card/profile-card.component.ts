import { animate, state, style, transition, trigger } from '@angular/animations';
import { isPlatformBrowser, isPlatformServer, NgOptimizedImage } from '@angular/common';
import { ApplicationRef, Component, ComponentRef, effect, HostListener, inject, Inject, input, OnInit, output, PLATFORM_ID, signal, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { environment } from '@environments/environment';
import { User, UserPermissions } from '@interfaces/user';
import { Post } from '@interfaces/post';
import { UserService } from '@services/user.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { first, Subject, takeUntil } from 'rxjs';
import { DialogService } from '@services/dialog.service';
import { ToastService } from '@services/toast.service';
import { SpinnerService } from '@services/spinner.service';
import { AuthService } from '@services/auth.service';
import { ChatService } from '@services/chat.service';
import { FormsModule, ReactiveFormsModule, } from '@angular/forms';
import { CountryService } from '@services/country.service';
import { UIStyles } from '@core/common/uistyles';
import { SocketService } from '@services/socket.service';
import { MessageService } from '@services/message.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { CalculateAgePipe } from '@pipes/calculate-age.pipe';
import { MetaTag } from '@interfaces/metaTags';
import { Title } from '@angular/platform-browser';
import { v4 as uuidv4 } from 'uuid';
import { Chat } from '@interfaces/chat';
import { ToolsService } from '@services/tools.service';
import { PostMediaDetails } from '@interfaces/postMedia';
import { PostMediaService } from '@services/post-media.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { KissService } from '@services/kiss.service';

@Component({
  selector: 'app-profile-card',
  imports: [
    CustomTranslatePipe,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    IconDirective,
    CalculateAgePipe
  ],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(30px) scale(0.96)',
          filter: 'blur(5px)'
        }),
        animate('650ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({
            opacity: 1,
            transform: 'translateY(0) scale(1)',
            filter: 'blur(0)'
          })
        )
      ])
    ])
  ],
  templateUrl: './profile-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile-card.component.scss'
})
export default class ProfileCardComponent {

  isBrowser: boolean;
  isServer: boolean;
  urlCurrent = 'users';
  item = input.required<User>();
  imageLoaded = signal(false);

  permissions: UserPermissions | null = null;
  public login = output<void>();

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();


  // components
  public router = inject(Router);
  public userService = inject(UserService);
  public dialogService = inject(DialogService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  public authService = inject(AuthService);
  private chatService = inject(ChatService);
  public countryService = inject(CountryService);
  private platformId = inject(PLATFORM_ID);
  private socketService = inject(SocketService);
  public messageService = inject(MessageService);
  private title = inject(Title);
  private toolsService = inject(ToolsService);
  public postMediaService = inject(PostMediaService);
  public transactionCreditService = inject(TransactionCreditService);
  private kissService = inject(KissService);

  constructor() {
    effect(() => {
      this.permissions = this.userService.permissions();
    });
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/default-avatar.png'; // Imagen por defecto
    this.imageLoaded.set(true); // Oculta skeleton aunque falle
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

  onProfile(user: User) {
    this.userService.addUserProfile(user);
    this.router.navigate(['/', user.username]);
  }

  // create chat
  async onChat(item: User) {

    if (this.authService.user()) {

      if (this.authService.user()?._id !== item._id) {
        this.spinnerService.start();

        const data = {
          Receiver: item
        }
        this.chatService.create(data)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              if (res) {
                this.messageService.addUserReceiver(item);
                this.chatService.addChat(res);
                this.router.navigate(['/chats/messages', res._id]);
              }
            },
            error: (err) => {
              this.spinnerService.close();
              this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
              console.error('Error al cargar los posts:', err);
            },
            complete: () => {
              this.spinnerService.close();
              console.log('Request completed');
            }
          });
      }

    } else {
      this.onLoginModal();
    }
  }

  onLoginModal() {
    this.login.emit();
  }

  // live
  onStartLiveStream() {

    const data: User = {
      liveRoomId: `${Date.now()}`
    };

    this.spinnerService.start();

    const userId = this.authService.user()?._id;
    this.userService.update(userId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const secretKey = 'your-secret-key'; // Cambia esto por una clave segura

          // Datos del usuario
          const userData = {
            username: this.authService.user()?.username,
            password: this.authService.user()?.password,
            route: `${this.authService.user()?.username}/live`,
            Site: environment.site
          };

          // Convertir datos a JSON y luego encriptar con XOR
          const jsonData = JSON.stringify(userData);
          const encryptedData = this.toolsService.xorEncryptDecrypt(jsonData, secretKey);

          // Codificar en Base64 para que sea seguro en la URL
          const encodedData = btoa(encryptedData);

          //const url = `${environment.urlPrivate}/auth/auto?data=${encodeURIComponent(encodedData)}`;
          //console.log(url0);
          //const url = `${environment.urlPrivate}/auth/auto`;
          //window.open(`${url}`, "_parent", "noopener,noreferrer");
          this.router.navigateByUrl(userData.route);
        },
        error: (err) => {
          this.spinnerService.close();
        },
        complete: () => {
          this.spinnerService.close();
        }
      });
  }

  onLiveStream(item: User) {

    if (this.authService.user()) {
      const secretKey = 'your-secret-key'; // Cambia esto por una clave segura

      // Datos del usuario
      const userData = {
        username: this.authService.user()?.username,
        password: this.authService.user()?.password,
        route: `/live/${item?.username}`,
        Site: environment.site
      };

      // Convertir datos a JSON y luego encriptar con XOR
      const jsonData = JSON.stringify(userData);
      const encryptedData = this.toolsService.xorEncryptDecrypt(jsonData, secretKey);

      // Codificar en Base64 para que sea seguro en la URL
      const encodedData = btoa(encryptedData);

      //const url = `${environment.urlPrivate}/auth/auto?data=${encodeURIComponent(encodedData)}`;
      //const url = `${environment.urlPrivate}/auth/auto`;
      //window.open(`${url}`, "_parent", "noopener,noreferrer");

      this.router.navigateByUrl(userData.route);
    } else {
      this.onLoginModal();
    }
  }

  onMatch(item: User) {
    const data = {
      Receiver: item
    }

    this.chatService.create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.sendMessage(res, item);
          }
        },
        error: (err) => {
          this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
        },
        complete: () => {
          this.toastService.start({ type: 'success', message: '❤️ I like you 😘💕' });

        }
      });

  }

  // send message
  sendMessage(chat: Chat, userReceiver: User): void {

    const userCredit = this.userService.userCurrent()?.UserCredit?.current || 0;
    const gender = this.authService.user()?.gender || 'MAN';

    // if (gender === 'MAN' && Number(userCredit) <= Number(0)) {
    //   this.onCreditPurchase();
    //   return;
    // }

    if (this.authService.user()! && chat) {
      const createPostMedia: any = [];
      const sendData: any = {
        code: uuidv4(),
        filesArray: createPostMedia,
        Chat: chat._id,
        Sender: this.authService.user()!._id,
        Receiver: userReceiver._id,
        message: 'Hello! ❤️ I like you 😘💕',
        status: 'SENT',
        Reply: null,
        credit: 0,
        typeView: 'FREE',
        previewMedia: false,
      }

      this.socketService.socket.emit('message-client', sendData);

      this.chatService.updateChat({
        lastMessageRead: false
      });

      // save locally
      delete sendData.filesArray;

      sendData.PostMedia = createPostMedia;
      sendData.createdAt = new Date();

      const currentMessages = this.messageService.messages();
      const updatedMessages = [...currentMessages, sendData];
      this.messageService.addMessages(updatedMessages);

    }
  }

  // function html
  isNewUser(createdAt: string): boolean {
    const createdDate = new Date(createdAt);
    const currentDate = new Date();
    const diffInDays = (currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays < 7;
  }

  getFirstLetter(name: string): string { return this.toolsService.getFirstLetter(name); }
  getMediaDetails(item: any): PostMediaDetails | null { return this.postMediaService.getBackgroundImageUrl(item); }

  // button class
  buttonClass() {
    return UIStyles.buttonClass();
  }

  cardModalClass() {
    return UIStyles.cardModalClass();
  }

  modalClass() {
    return UIStyles.modalClass();
  }
}

