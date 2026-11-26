import { Component, ComponentRef, ElementRef, HostListener, PLATFORM_ID, ViewChild, ViewContainerRef, WritableSignal, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser, isPlatformServer, Location } from '@angular/common';
import { Message } from '@interfaces/message';
import { Chat, TypeChat } from '@interfaces/chat';
import { UserPermissions, UserRole, } from '@interfaces/user';
import { PostMedia, PostMediaDetails } from '@interfaces/postMedia';
import { DialogService } from '@services/dialog.service';
import { AuthService } from '@services/auth.service';
import { MessageService } from '@services/message.service';
import { TipService } from '@services/tip.service';
import { SocketService } from '@services/socket.service';
import { ToastService } from '@services/toast.service';
import { SpinnerService } from '@services/spinner.service';
import { PostMediaService } from '@services/post-media.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { ChatService } from '@services/chat.service';
import { NumericValidator, PricePostValidator } from '@core/common/custom-validators.ts';
import { UIStyles } from '@core/common/uistyles';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { Subject, takeUntil } from 'rxjs';
import { PostService } from '@services/post.service';
import { CloudflareService } from '@services/cloudflare.service';
import { environment } from '@environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { Post } from '@interfaces/post';
import { UserService } from '@services/user.service';
import { Title } from '@angular/platform-browser';
import { IconDirective } from '@directive/coin-svg.directive';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { AutoResizeTextareaDirective } from '@directive/auto-resize-textarea.directive';
import { EmailService } from '@services/email.service';
import { ToolsService } from '@services/tools.service';
import { LiveStreamService } from '@services/live-stream.service';
import { JoinCallComponent } from '@shared/join-call/join-call.component';
import { DropdownMenuItem } from '@interfaces/tools';
import { PaymentOrderService } from '@services/payment-order.service';
import { PaymentOrder } from '@interfaces/paymentOrder';
import P2pOrderChatComponent from '../p2p-order-chat/p2p-order-chat.component';
import { NumberFormatPipe } from '@pipes/number-format.pipe';

@Component({
  selector: 'app-messages-chat',
  imports: [
    CustomTranslatePipe,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    IconDirective,
    DateAgoPipe,
    TruncatePipe,
    AutoResizeTextareaDirective,
    NumberFormatPipe
  ],
  templateUrl: './messages-chat.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './messages-chat.component.scss'
})
export default class MessagesChatComponent {

  isBrowser: boolean;
  isServer: boolean;
  public isLoading = signal(true);
  maxSizeInMB = environment.maxSizeInMB;
  public className = UIStyles;

  hasMore = true;
  totalPages = 0;
  currentPage = 0;
  limitPage = 20;

  showEmojiPicker = false;

  emojis: Record<string, string[]> = {
    // ===== CATEGORÍAS EXISTENTES =====

    '🔥': ["🔥", "💦", "💋", "😈", "😏", "😜", "😝", "😋", "🤤", "🥵", "🥴", "😵", "🤪", "😍", "🥰", "😘", "😚", "😗", "😙", "💃", "🕺", "💅", "👅", "👄", "👀", "🫦", "🌶️", "🍆", "🍑", "🍒", "🍓", "🍌", "🍉", "🥒", "🌭", "🍭", "🍯", "🧁", "🍡", "🍨", "🍦", "🎂", "🍰", "🧈", "🫠", "🫣", "🫶", "🤟", "🤙", "👉", "👈", "🖕"],

    '😀': ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖"],
    '👋': ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "🖕", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👣"],
    '🙈': ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🪰", "🪲", "🪳", "🦗", "🕷️", "🕸️", "🦂", "🐢"],
    '🍉': ["🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🫐", "🥝", "🍅", "🫒", "🥥", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🫑", "🥒", "🥬", "🥦", "🧄", "🧅", "🍄", "🥜", "🫘", "🌰", "🥐", "🥖", "🫓", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🍔", "🍟", "🍕", "🌭", "🌮", "🌯", "🫔", "🥙", "🧆", "🥗", "🥘", "🫕", "🍝", "🍜", "🍲", "🍣", "🍤", "🥟", "🦪", "🍥"],
    '❤️': ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🈳", "🈹", "☢️", "☣️", "🚭", "❗", "❓"],

    // ===== NUEVAS CATEGORÍAS "HOT" 🔥 ===== 

    '💦': ["💦", "💧", "🌊", "🫧", "🧊", "🥶", "🥵", "🤒", "🤧", "😷", "🤤", "😮‍💨", "😵‍💫", "😶‍🌫️", "🫠", "🫣", "🫢", "🫡", "🫥", "🌬️", "💨", "🌫️", "🌪️", "⛄", "☃️", "🏊", "🏊‍♀️", "🏊‍♂️", "🤽", "🤽‍♀️", "🤽‍♂️", "🚿", "🛁", "🧼", "🧽", "🧴", "🪥", "🪒", "🧖", "🧖‍♀️", "🧖‍♂️", "🏖️", "🏝️", "🏜️", "⛱️", "🌅", "🌄", "🌠", "🎇", "🎆"],

    '💋': ["💋", "💄", "💍", "💎", "👠", "👡", "👢", "👙", "👗", "👘", "🥻", "🩱", "🩲", "🩳", "💐", "🌹", "🌷", "🌸", "🌺", "🪷", "💌", "💘", "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️", "❤️‍🔥", "❤️‍🩹", "💔", "🫀", "🩸", "🧴", "🧼", "🪞", "🧽", "🪒", "🧖", "🛁", "🚿", "🛏️", "🪨", "🕯️", "🪩", "🎀", "🧸", "💼"],

    '💃': ["💃", "🕺", "👯", "👯‍♂️", "🤸", "🤸‍♀️", "🧘", "🧘‍♀️", "🧖", "🧖‍♀️", "🛀", "💆", "💆‍♀️", "💇", "💇‍♀️", "💪", "🦵", "🦶", "👣", "👀", "👁️", "👅", "👄", "🫦", "🦷", "🦴", "👂", "👃", "🧠", "🫀", "🫁", "👶", "👧", "🧒", "👦", "👩", "🧑", "👨", "👩‍🦰", "🧑‍🦰", "👨‍🦰", "👩‍🦱", "🧑‍🦱", "👨‍🦱", "👩‍🦳", "🧑‍🦳", "👨‍🦳", "👩‍🦲", "🧑‍🦲", "👨‍🦲"],

    '😈': ["😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🙈", "🙉", "🙊", "💋", "💌", "💘", "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️", "💔", "❤️‍🔥", "❤️‍🩹", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "🫂", "👤", "👥", "🫂"],

    //'🍑': ["🍑", "🍆", "🍒", "🍓", "🍌", "🥒", "🌽", "🍉", "🍈", "🥝", "🥭", "🍍", "🍊", "🍋", "🍇", "🍎", "🍏", "🍐", "🥥", "🥑", "🍅", "🫒", "🌶️", "🍯", "🍭", "🍬", "🍫", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍨", "🍦", "🍡", "🍧", "🧈", "🥞", "🧇", "🥐", "🥖", "🥨", "🧀", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🌮", "🌯", "🥙", "🥟", "🍣", "🍤", "🦪"]
  };

  emojiCategories: string[] = Object.keys(this.emojis);
  emojiSelectedTab = 0;
  private allowedCharacters = /^[a-zA-Z0-9\s]$/;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('emojiContainer') emojiContainer!: ElementRef;
  @ViewChild('p2pContainer', { read: ViewContainerRef }) p2pContainerRef!: ViewContainerRef;
  private p2pOrderChatComponentRef: ComponentRef<P2pOrderChatComponent> | null = null;

  private destroy$ = new Subject<void>();

  // scroll
  private isUserNearBottom = true;
  showScrollButton = false;
  private isUserScrolling = false; // Indica si el usuario está interactuando con el scroll
  private lastScrollTop = 0; // Guarda la última posición del scroll

  idChat: string | null;
  myform: FormGroup;
  reply: Message | null;

  typeViewArray = [
    { name: 'payment', value: 'UNPAID' },
    { name: 'free', value: 'FREE' }
  ]

  filesArray: WritableSignal<PostMedia[]> = signal([]);
  selectedFiles: PostMedia[] = [];

  isTyping = signal(false);
  typingTimeout: any;

  currentDate: any;
  audio: HTMLAudioElement | null = null;

  permissions: UserPermissions | null = null;
  paymentOrder = signal<PaymentOrder | null>(null);
  // chat
  isSenderEmail = signal(false);
  messagesList: WritableSignal<Message[]> = signal([]);
  public activeMenu = signal<string | null>(null);

  // components
  private joinCallComponentRef: ComponentRef<JoinCallComponent> | null = null;

  public dialogService = inject(DialogService);
  private activatedRoute = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  public userService = inject(UserService);
  private socketService = inject(SocketService);
  public messageService = inject(MessageService);
  private tipService = inject(TipService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  private postMediaService = inject(PostMediaService);
  private cloudflareService = inject(CloudflareService);
  private transactionCreditService = inject(TransactionCreditService);
  public chatService = inject(ChatService);
  private platformId = inject(PLATFORM_ID);
  private postService = inject(PostService);
  private title = inject(Title);
  private emailService = inject(EmailService);
  private toolsService = inject(ToolsService);
  private liveStreamService = inject(LiveStreamService);
  public paymentOrderService = inject(PaymentOrderService);

  constructor() {
    this.title.setTitle('Messages');
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    this.idChat = this.activatedRoute.snapshot.paramMap.get('idChat');
    this.messagesList = this.messageService.messages;

    effect(() => {
      this.permissions = this.userService.permissions();
      this.paymentOrder.set(this.paymentOrderService.paymentOrder());
    });
  }



  async ngOnInit() {
    if (this.isBrowser) {
      this.createFormControls();

      if (this.authService.user()) {
        // Primero cargamos los mensajes por HTTP
        await this.userChat();
      } else {
        this.router.navigate(['/chats']);
      }

    }
  }

  ngAfterViewInit(): void {

  }

  ngAfterViewChecked() {

  }

  ngOnDestroy() {
    if (this.isBrowser) {
      this.destroy$.next();
      this.destroy$.complete();
      this.detachSocketEvents();
    }
  }

  createFormControls() {
    this.myform = this.fb.group({
      fileImages: ['', [Validators.nullValidator]],
      message: [null, Validators.required],
      typeView: ['FREE'],
      credit: [0, [Validators.required, PricePostValidator, NumericValidator]],
      isPreviewMedia: [false, Validators.nullValidator],
      isDownload: [false, Validators.nullValidator],
    });
  }

  updateMessageValidation() {
    const messageControl = this.myform.get('message');
    if (!messageControl) return;

    if (this.filesArray().length > 0) {
      // Si hay archivos, quitamos la validación required
      messageControl.clearValidators();
    } else {
      // Si no hay archivos, volvemos a poner required
      messageControl.setValidators([Validators.required]);
    }
    messageControl.updateValueAndValidity();
  }

  // find chat 
  async userChat() {
    this.messageService.resetMessages();

    this.messageService.findByChat(this.idChat!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const { Chat, Receiver } = res!;
          if (this.currentPage === 0) {
            if (!this.permissions?.canSendMessages && this.chatService.chat()?.type === TypeChat.PERSONAL) {
              this.dialogService.toggleModal('creditPurchase');
            }
          }
          this.chatService.addChat(Chat!);
          this.currentDate = res!.currentDate;

          if (Chat?.TransactionCredit?.PaymentOrder) {
            this.paymentOrderService.addPaymentOrder(Chat?.TransactionCredit?.PaymentOrder!);
          }

          if (this.messageService.userReceiver()) {
            this.messageService.updateUserReceiver(res?.Receiver!);
          } else {
            this.messageService.addUserReceiver(res?.Receiver!);
          }

          if (res!.Messages) {
            this.messageService.addMessages([...res!.Messages]);
          }

          this.userOnlineSocket();

          // if (Chat?.type === 'P2P') {
          //   setTimeout(() => {
          //     this.loadP2pOrderBanner();
          //   }, 50);
          // }

        },
        error: (err) => {
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
  }

  trackByMessage(index: number, item: any): string {
    return item._id || item.code || index.toString();
  }

  // socket
  userOnlineSocket() {

    if (!this.socketService.socket) {
      this.socketService.connect();
    }

    this.onUpdateToRead();

    this.socketService.onNewMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {

        const { message } = data;

        if (this.idChat !== message.Chat)
          return;

        const currentMessages = this.messageService.messages();
        const exists = currentMessages.some(msg =>
          (message.code && msg.code === message.code) || msg._id === message._id
        );

        if (!exists) {
          this.messageService.addMessages([message, ...currentMessages]);
        } else {
          this.messageService.updateMessages(message.code, { _id: message._id });
        }

        if (this.idChat === message.Chat) {
          this.onUpdateToRead();
        }

        if (this.isUserNearBottom) {
          setTimeout(() => {
            if (this.messagesContainer && this.messagesContainer.nativeElement) {
              this.messagesContainer.nativeElement.scrollTop = 0;
            }
          }, 30);
        }

      });

    this.socketService.onMessageRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const { chat } = data;
        if (this.idChat === chat._id) {

          const updatedMessages = this.messageService.messages().map(msg => {
            if (msg.status !== 'READ') {
              return { ...msg, status: 'READ' };
            }
            return msg;
          });

          this.messageService.addMessages(updatedMessages);
        }
      });

    this.socketService.onMessageDeleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const { deletedMessage } = data;
        if (deletedMessage) {
          this.messageService.removeMessages(deletedMessage._id!);
        }
      });

    this.socketService.onTypingStatusReceived()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const { chatId, userId, isTyping } = data;
        if (chatId === this.idChat && userId === this.messageService.userReceiver()?._id) {
          this.isTyping.set(isTyping);
        }
      });

    // taximeter
    this.socketService.onTaximeterRunOut()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const outNotice: Message = {
          _id: `sys_out_${Date.now()}`,
          code: `sys_out_${Date.now()}`,
          message: data.message || 'userRunsOut',
          isSystemMessage: true,
          systemType: 'RUNOUT' as any,
          PostMedia: [],
          createdAt: `${new Date()}`
        };
        this.messageService.appendMessage(outNotice);
        this.onSrolldown();
      });

    this.socketService.onTaximeterBilled()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const billingNotice: Message = {
          _id: `sys_out_${Date.now()}`,
          code: 'sys_bill_' + Date.now(),
          message: data.message || 'deductedTime',
          isSystemMessage: true,
          systemType: 'BILLED' as any,
          PostMedia: [],
          createdAt: `${new Date()}`
        };
        this.messageService.appendMessage(billingNotice);
        this.onSrolldown();
      });

    this.socketService.onTaximeterPaused()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const currentMsgs = this.messageService.messages();
        // Evitamos spamear líneas consecutivas de pausa si ya existe una al final
        if (currentMsgs[0]?.systemType === ('PAUSED' as any)) return;

        const pauseNotice: Message = {
          _id: `sys_out_${Date.now()}`,
          code: 'sys_pause_' + Date.now(),
          message: data.message || 'taximeterPaused',
          isSystemMessage: true,
          systemType: 'PAUSED' as any,
          PostMedia: [],
          createdAt: `${new Date()}`
        };
        this.messageService.appendMessage(pauseNotice);
        this.onSrolldown();
      });

    this.socketService.onTaximeterGracePeriod()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const currentMsgs = this.messageService.messages();
        if (currentMsgs[0]?.systemType === ('GRACE' as any)) return;

        const graceNotice: Message = {
          _id: `sys_out_${Date.now()}`,
          code: 'sys_grace_' + Date.now(),
          message: `gracePeriodActive`,
          isSystemMessage: true,
          systemType: 'GRACE' as any,
          PostMedia: [],
          createdAt: `${new Date()}`
        };
        this.messageService.appendMessage(graceNotice);
        this.onSrolldown();
      });

    if (this.idChat && this.authService.user()) {
      this.socketService.socket.emit('message:startChatTaximeter', {
        taximeterId: this.idChat,
        receiverId: this.messageService.userReceiver()?._id,
        receiverUsername: this.messageService.userReceiver()?.username
      });
    }

  }

  detachSocketEvents() {
    if (this.socketService.socket) {
      const roomName = `chat_${this.idChat}`;
      this.socketService.leaveRoom(roomName, (res) => {
        if (res && res.status === 'left') {
        }
      });

      this.socketService.socket.emit('message:stopChatTaximeter', {
        taximeterId: this.idChat
      });
    }
  }

  // 2. Agrega la señal y el método para el botón de audio
  isRecording = signal(false);

  toggleAudioRecording() {
    this.isRecording.update(v => !v);
    if (this.isRecording()) {
      // TODO: Aquí iría la lógica real de grabación (ej. MediaRecorder API)
      this.toastService.start({ type: 'info', message: 'Grabación iniciada' });
    } else {
      // TODO: Aquí iría la lógica para detener y enviar el audio
      this.toastService.start({ type: 'info', message: 'Grabación finalizada (pendiente de implementar)' });
    }
  }

  // send message with video and images
  async onSubmit() {
    this.dialogService.closeModal();

    if (!this.permissions?.canSendMessages && this.chatService.chat()?.type === TypeChat.PERSONAL) {
      this.dialogService.toggleModal('creditPurchase');
      return;
    }

    const formValues = this.myform.getRawValue();

    if (this.myform.valid && this.authService.user()! && this.idChat) {

      this.spinnerService.start();

      const createPostMedia: any[] = [];

      let credit = Number(formValues.credit) || 0;
      if (this.filesArray().length === 0) {
        credit = 0;
      }
      const data: any = {
        code: uuidv4(),
        filesArray: createPostMedia,
        Chat: this.chatService.chat()!._id,
        Sender: this.authService.user()!._id,
        Receiver: this.messageService.userReceiver()!._id,
        message: formValues.message,
        status: 'SENT',
        Reply: this.reply,
        credit: credit,
        typeView: credit > 0 ? 'UNPAID' : 'FREE',
        isPreviewMedia: formValues.isPreviewMedia,
        isDownload: formValues.isDownload,
        PostMedia: createPostMedia,
        createdAt: new Date(),
      };

      const uploadPromises = this.filesArray().map(async (item: any) => {
        try {
          const additionalObject: any = {
            type: item.file.type!.split('/')[0],
            extension: item.file.type!.split('/')[1],
          };
          if (item.file.type!.split('/')[0] == 'video') {
            const resVideo = await this.cloudflareService.uploadToVideoCloudflare(item.file);
            if (resVideo) {
              additionalObject.cloudflare = resVideo;
            }
          } else if (item.file.type!.split('/')[0] == 'image') {
            const resImage = await this.cloudflareService.uploadToImageCloudflare(item.file);
            if (resImage !== null) {
              additionalObject.cloudflare = resImage;
            }
          }

          if (additionalObject.cloudflare) {
            data.filesArray.push(additionalObject);
          }

        } catch (error) {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        }
      });

      this.onResetFormMedia();

      Promise.all(uploadPromises).then(async () => {

        this.spinnerService.close();

        const currentMessages = this.messageService.messages();
        const updatedMessages = [data, ...currentMessages];
        this.messageService.addMessages(updatedMessages);

        setTimeout(() => {
          this.isUserNearBottom = true;
          this.scrollToBottom();
        }, 60);

        await this.onSendMessage(data);

      });

    }
  }

  // send messate
  async onSendMessage(data: any) {
    // update chat
    const chat: any = {
      _id: this.idChat!
    }
    const chatExist: Chat = this.chatService.chats().find(c => c!._id === chat._id)!;
    // eliminamos estos dos datos para no confundir al chat
    const updatedChat = { ...chat };
    updatedChat.Receiver = this.messageService.userReceiver();
    updatedChat.User = this.messageService.userReceiver();

    if (chatExist) {
      updatedChat.User.countCredit = updatedChat.User.countCredit || { current: 0 };
      updatedChat.User.countCredit.current = chatExist.User?.countCredit?.current || 0;
      this.chatService.updateChats(chat._id!, updatedChat);
    } else {
      const currentChats = this.chatService.chats();
      const updatedChats = [updatedChat, ...currentChats];
      this.chatService.addChats(updatedChats);
    }

    this.messageService.create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.onSendEmail(res);
          }
        },
        error: (err) => {

        },
        complete: () => {

        }
      });
  }

  async onUpdateToRead() {

    const dataUpdate = {
      Chat: this.chatService.chat()!?._id,
      Receiver: this.authService.user()!._id,
      Sender: this.messageService.userReceiver()?._id,
    };

    this.messageService.updateToRead(dataUpdate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.authService.updateUser({ countUnreadMessages: res.countUnreadMessagesReceiver });
          }
        },
        error: (err) => {

        },
        complete: () => {

        }
      });
  }

  // delete reply
  onReplyDelete() {
    this.reply = null;
  }

  onSrolldown() {
    setTimeout(() => {
      this.isUserNearBottom = true;
      this.scrollToBottom();
    }, 60);
  }

  // message buy
  async onMessageBuy(item: Message) {

    if (this.authService.user()!) {
      this.spinnerService.start();
      const Message: Message = item;
      if (Number(Message.credit) <= Number(this.userService.userCurrent()!.UserCredit!.current)) {
        const data = {
          creditAmount: Message.credit,
          type: 'CONTENT_SALE',
          typeContent: 'MESSAGE',
          Receiver: this.messageService.userReceiver(),
          MessageId: Message._id
        };

        this.transactionCreditService.createTransfer(data)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              if (res?.Message) {

                const messageIndex = this.messageService.messages().findIndex(message => message._id === Message._id);

                if (messageIndex !== -1) {
                  this.toastService.start({ type: 'success', message: 'purchaseSuccess' });
                  this.messageService.messages()[messageIndex].typeView = res?.Message?.typeView;
                }
              }

              this.spinnerService.close();

            },
            error: (err) => {
              this.spinnerService.close();
            },
            complete: () => {
              this.spinnerService.close();
            }
          });
      } else {
        this.spinnerService.close();
        this.dialogService.toggleModal('creditPurchase');
      }
    }
  }

  onResetFormMedia() {
    // 1. Vaciamos las señales y estados locales de las previsualizaciones
    this.filesArray.set([]);
    this.selectedFiles = [];

    // 2. Reseteamos el formulario reactivo restaurando sus valores por defecto seguros
    this.myform.reset({
      fileImages: '',
      message: '',
      typeView: 'UNPAID',
      credit: 0,
      isPreviewMedia: false
    });

    this.updateMessageValidation();

    // 3. SOLUCIÓN CRÍTICA: Forzamos el vaciado del input nativo en el DOM usando ViewChild
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // 2. Se ejecuta al seleccionar archivos, los carga y abre el modal automáticamente
  onFileChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const maxSizeInMB = this.maxSizeInMB;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

      // Opcional: Reiniciamos la lista si prefieres manejar selección nueva
      //this.filesArray.set([]);

      var i = Number(0);
      for (let file of event.target.files) {
        if (file.size >= maxSizeInBytes) {
          this.toastService.start({ type: 'error', message: `fileTooLarge` });
          return;
        }

        const name = `post-${uuidv4()}`;
        const mimetype = event.target.files[i].type.split('/')[1];
        let myNewFile: any = new File([event.target.files[i]], `${name}.${mimetype}`, { type: event.target.files[i].type });

        var reader = new FileReader();
        reader.onload = (e: any) => {
          const newFile: PostMedia = {
            _id: `${name}`,
            typeFile: file.type.split('/'),
            url: e.target.result,
            type: 'ORIGINAL',
            cover: false,
            file: myNewFile
          };

          this.filesArray.update((prevFiles) => [...prevFiles, newFile]);
          this.updateMessageValidation();

          // 🔥 AQUÍ ESTÁ LA MAGIA: Una vez cargado el archivo, abrimos el modal de previsualización
          if (!this.dialogService.activeModal() || this.dialogService.activeModal() !== 'mediaMessage') {
            this.dialogService.toggleModal('mediaMessage');
          }
        };

        reader.readAsDataURL(event.target.files[i]);
        i++;
      }
    }
  }

  // 📋 Método para detectar cuando pegan una imagen o video con Ctrl+V
  onPasteClipboard(event: ClipboardEvent) {
    if (event.clipboardData?.files && event.clipboardData.files.length > 0) {
      const maxSizeInMB = this.maxSizeInMB;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

      var i = Number(0);
      for (let file of event.clipboardData.files) {
        if (file.size >= maxSizeInBytes) {
          this.toastService.start({ type: 'error', message: `fileTooLarge` });
          return;
        }

        const name = `post-${uuidv4()}`;
        const mimetype = event.clipboardData.files[i].type.split('/')[1];
        let myNewFile: any = new File([event.clipboardData.files[i]], `${name}.${mimetype}`, { type: event.clipboardData.files[i].type });

        var reader = new FileReader();
        reader.onload = (e: any) => {
          const newFile: PostMedia = {
            _id: `${name}`,
            typeFile: file.type.split('/'),
            url: e.target.result,
            type: 'ORIGINAL',
            cover: false,
            file: myNewFile
          };

          this.filesArray.update((prevFiles) => [...prevFiles, newFile]);
          this.updateMessageValidation();

          // 🔥 AQUÍ ESTÁ LA MAGIA: Una vez cargado el archivo, abrimos el modal de previsualización
          if (!this.dialogService.activeModal() || this.dialogService.activeModal() !== 'mediaMessage') {
            this.dialogService.toggleModal('mediaMessage');
          }
        };

        reader.readAsDataURL(event.clipboardData.files[i]);
        i++;
      }
    }
  }

  // delete file
  deleteImage(file: any) {
    this.filesArray.update((prevFiles) =>
      prevFiles.filter((item) => item._id !== file._id)
    );

    this.updateMessageValidation();

    if (this.filesArray().length === 0) {
      this.myform.patchValue({ fileImages: null });
    }
  }

  onDelete(message: Message) {
    if (message && message._id) {
      this.messageService.removeMessages(message._id!);
      this.messageService.remove(message._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {
            }
          },
          error: (err) => {
          },
          complete: () => {
          }
        });
    }

  }

  // send email
  async onSendEmail(data: any) {
    const { email } = data;

    if (this.isSenderEmail()) {
      return;
    }
    const res = await this.emailService.sendMail(email);
    if (res && res.status === "enqueued") {
      this.isSenderEmail.set(true);
    }
  }

  // created reply
  onReply(item: Message) {
    this.reply = item;
  }

  // writing
  onTextareaInput() {
    if (!this.authService.user()!) return;

    const sendData = {
      Chat: this.chatService.chat()!._id!,
      User: this.authService.user()!._id,
      isTyping: true
    };

    this.socketService.socket.emit('message:typing_status_send', sendData);

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      if (!this.authService.user()!) return;

      const sendData = {
        Chat: this.chatService.chat()!._id!,
        User: this.authService.user()!._id,
        isTyping: false
      };
      this.socketService.socket.emit('message:typing_status_send', sendData);
    }, 500); // Puedes ajustar el tiempo según tus necesidades
  }

  // is not writing
  onTextareaBlur() {

    if (!this.authService.user()!) return;

    this.isTyping.set(false);
    const sendData = {
      Chat: this.chatService.chat()!._id!,
      User: this.authService.user()!._id,
      isTyping: false
    };
    this.socketService.socket.emit('typing_status_send', sendData);
  }

  // copy link receiver
  copyText() {
    const textToCopy = `https://${environment.domain}` + this.messageService.userReceiver()!.username;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.toastService.start({ type: 'success', message: 'copied_link' });
    });
  }

  onUpgradeChat(payload: any) {
    const chat: Chat = this.chatService.chats().find(chat => chat!._id === payload._id)!;
    if (chat) {
      chat.LastMessage = payload.LastMessage;
      chat.lastMessageAt = payload.lastMessageAt;

      this.chatService.removeChats(chat._id!);
      const currentChats = this.chatService.chats();
      const updatedChats = [chat, ...currentChats];
      this.chatService.addChats(updatedChats);
    }
  }

  // modal
  // 1. Simula el click en el input de archivos nativo del sistema
  triggerFileInput() {

    //this.filesArray.set([]);

    if (!this.permissions?.canSendMessages && this.chatService.chat()?.type === TypeChat.PERSONAL) {
      this.dialogService.toggleModal('creditPurchase');
      return;
    }

    // Disparamos el explorador de archivos nativo
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.click();
    }
  }

  async onDialogMedia() {

    const user = this.authService.user()!;
    if (user.status === 'SUSPENDED') {
      this.toastService.start({ type: 'error', message: 'accountSuspended' });
      return;
    }

    const userCredit = this.userService.userCurrent()?.UserCredit?.current || 0;
    const gender = this.authService.user()?.gender || 'MAN';

    if (gender === 'MAN' && Number(userCredit) <= Number(0)) {
      this.dialogService.toggleModal('creditPurchase');
      return;
    }

    this.filesArray.set([]);
    this.dialogService.toggleModal('mediaMessage');

  }

  onModalPost(message: Message) {

    if (message.typeView === 'UNPAID' && this.authService.user()!._id !== message.Sender) {

      if (!this.permissions?.canSendMessages) {
        this.dialogService.toggleModal('creditPurchase');
        return;
      }

      this.onMessageBuy(message);
      return;
    }

    const post: Post = {
      slug: message._id,
      route: `chats/messages/${this.idChat}`,
      likes: 0,
      PostMedia: message.PostMedia,
      description: message.message,
      credit: message.credit,
      typeView: message.typeView,
    };

    if (this.authService.user()! && this.authService.user()!._id !== message.Sender) {
      post.User = this.messageService.userReceiver()!
    } else {
      post.User = this.authService.user()!
    }
    this.postService.addPost(post);
    this.messageService.addMessage(message);

    this.router.navigate(['chats/messages', this.idChat, message._id]);
  }

  verifiedPrivate(item: Message) {
    if (!item) {
      return false;
    }

    const typeView = item?.typeView;
    let currentPrivate = false;

    if (typeView === 'FREE' || this.authService?.user()?._id === item?.Sender) {
      currentPrivate = false;
    } else if (typeView === 'UNPAID') {
      currentPrivate = true;
    } else if (typeView === 'PAID') {
      currentPrivate = false;
    } else {
      currentPrivate = true;
    }

    return currentPrivate;
  }

  // tip
  onTip() {
    if (this.messageService.userReceiver()) {
      const dataTip: any = {
        type: 'TIP',
        typeContent: 'MESSAGE',
        user: this.messageService.userReceiver()
      };
      this.tipService.addTip(dataTip);

      this.dialogService.toggleModal('tipCredit');
    }
  }

  // video call
  async requestJoinCall() {

    if (!this.permissions?.canSendMessages) {
      this.dialogService.toggleModal('creditPurchase');
      return;
    }

    this.spinnerService.start();
    const dataLive: any = {
      transmissionType: "VIDEOCALL",
      live: true,
      invitedUserIds: [this.messageService.userReceiver()!._id]
    }
    this.liveStreamService.handleLiveStreamStatus(dataLive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (liveStream) => {
          if (liveStream) {
            this.onJoinCall();
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'videoCallRequestSent' });
        }
      });

  }

  onJoinCall() {
    this.clearJoinCallComponent();
    const componentRef = this.viewContainerRef.createComponent(JoinCallComponent);
    this.joinCallComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearJoinCallComponent();
      this.dialogService.closeModal();
    });
    this.dialogService.toggleModal('modalRequestJoinCall');
  }

  private clearJoinCallComponent() {
    if (this.joinCallComponentRef) {
      this.joinCallComponentRef.destroy();
      this.joinCallComponentRef = null;
    }
  }

  // Método para instanciar el componente P2P dinámicamente
  onP2pOrder() {
    if (!this.p2pContainerRef) return;

    this.clearP2pOrderChatComponent();
    const componentRef = this.p2pContainerRef.createComponent(P2pOrderChatComponent);
    this.p2pOrderChatComponentRef = componentRef;
    const transactionCredit = this.chatService.chat()?.TransactionCredit;
    componentRef.instance.transactionCredit = transactionCredit;
    componentRef.instance.close.subscribe(() => {
      this.clearP2pOrderChatComponent();
    });
  }

  private clearP2pOrderChatComponent() {
    if (this.p2pOrderChatComponentRef) {
      this.p2pOrderChatComponentRef.destroy();
      this.p2pOrderChatComponentRef = null;
    }
  }

  //++++++EMOJI++++++
  toggleEmoji() {
    const isOpen = this.activeMenu() === 'emojiContainer';
    this.activeMenu.set(isOpen ? null : 'emojiContainer');
    this.showEmojiPicker = !isOpen;
  }

  addEmoji(emoji: string): void {
    const textProp = this.myform.get('message');
    textProp?.setValue((textProp.value || '') + emoji);
    //this.activeMenu.set(null);
    //this.showEmojiPicker = false;
  }

  selectTabEmoji(index: number): void { this.emojiSelectedTab = index; }

  //++++++DOCUMENT++++++
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.activeMenu() && !target.closest('.rounded-full') && !target.closest('.menu-container')) {
      this.activeMenu.set(null);
    }

    if (this.showEmojiPicker && this.emojiContainer && !this.emojiContainer.nativeElement.contains(target)) this.showEmojiPicker = false;

    if (this.activeMenu() && !target.closest('.rounded-full') && !target.closest('.menu-container')) {
      this.activeMenu.set(null);
    }

    if (this.activeMenu() === 'emojiContainer') {
      const clickedInsidePanel = target.closest('.emoji-container');
      const clickedToggleButton = target.closest('#text + button') || target.closest('.fa-face-grin'); // Detecta el botón de la carita

      if (!clickedInsidePanel && !clickedToggleButton) {
        this.activeMenu.set(null);
        this.showEmojiPicker = false;
      }
      return; // Salimos para evitar interferencias
    }
  }

  // menu
  toggleMenuMessage(messageId: string) {
    const isOpen = this.activeMenu() === messageId;
    this.activeMenu.set(isOpen ? null : messageId);

    // Si abrimos un menú de mensaje, aseguramos que el emoji picker se cierre
    if (!isOpen) {
      this.showEmojiPicker = false;
    }
  }

  get receiverMenuItems(): DropdownMenuItem[] {
    return [
      {
        label: 'reply',
        icon: 'reply-regular',
        action: (message: Message) => this.onReply(message),
        visible: true
      },
    ];
  }

  get senderMenuItems(): DropdownMenuItem[] {
    return [
      {
        label: 'delete',
        icon: 'delete-regular',
        action: (message: Message) => this.onDelete(message),
        visible: true
      },
      {
        label: 'reply',
        icon: 'reply-regular',
        action: (message: Message) => this.onReply(message),
        visible: true
      }
    ];
  }

  // return 
  onReturn(): void {
    this.router.navigate(['/chats']);
  }

  innerText(text: any) {
    return UIStyles.innerTextChat(text);
  }

  // roles
  getRoles(role: string): boolean {
    return !!this.userService.userProfile()?.roles?.includes(role as UserRole);
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

  // scroll
  scrollToBottom() {
    if (this.messagesContainer && this.messagesContainer.nativeElement) {
      this.messagesContainer.nativeElement.scrollTo({
        top: 0, // 🔥 En column-reverse, el fondo es la posición 0
        behavior: 'smooth'
      });
      this.showScrollButton = false;
      this.isUserNearBottom = true;
    }
  }

  // Maneja el evento de scroll con lógica invertida
  onScroll() {
    const container = this.messagesContainer.nativeElement;

    // threshold: Margen en píxeles para detectar si el usuario se alejó del fondo
    const threshold = 80;

    // En column-reverse, si scrollTop es menor o igual al threshold, significa que estás abajo
    // Nota: Usamos Math.abs porque algunos navegadores manejan valores negativos al invertir el eje
    const currentScroll = Math.abs(container.scrollTop);

    this.isUserNearBottom = currentScroll <= threshold;

    // Mostramos el botón flotante SOLO si el usuario subió a revisar el historial (lejos de 0)
    this.showScrollButton = !this.isUserNearBottom;

    this.isUserScrolling = container.scrollTop < this.lastScrollTop;
    this.lastScrollTop = container.scrollTop;
  }

  // Detecta cuando el usuario deja de interactuar con el scroll
  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  onScrollEnd() {
    setTimeout(() => {
      this.isUserScrolling = false; // Restablece el estado después de que el usuario termine de interactuar
    }, 100);
  }

  getFirstLetter(name: string): string {
    return this.toolsService.getFirstLetter(name);
  }

  // get media details
  getMediaDetails(item: any): PostMediaDetails | null {
    return this.postMediaService.getBackgroundImageUrl(item);
  }

}
