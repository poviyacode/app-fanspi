import { AfterViewInit, ApplicationRef, Component, ComponentRef, effect, ElementRef, HostListener, inject, PLATFORM_ID, QueryList, signal, ViewChild, ViewChildren, ViewContainerRef, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser, isPlatformServer, Location, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { Chat } from '@interfaces/chat';
import { ChatService } from '@services/chat.service';
import { SpinnerService } from '@services/spinner.service';
import { AuthService } from '@services/auth.service';
import { SocketService } from '@services/socket.service';
import { UIStyles } from '@core/common/uistyles';
import { User } from '@interfaces/user';
import { first, Subject, Subscription, takeUntil } from 'rxjs';
import { MessageService } from '@services/message.service';
import { ToolsService } from '@services/tools.service';
import { Title } from '@angular/platform-browser';
import { IconDirective } from '@directive/coin-svg.directive';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import { DialogService } from '@services/dialog.service';
import MessageBroadcastChatComponent from '../message-broadcast-chat/message-broadcast-chat.component';
import { ToastService } from '@services/toast.service';
import { environment } from '@environments/environment';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-users-chat',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    IconDirective,
    DateAgoPipe,
  ],
  templateUrl: './users-chat.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./users-chat.component.scss']
})
export default class UsersChatComponent implements AfterViewInit {

  isBrowser: boolean;
  isServer: boolean;
  isStable: boolean = true;
  isTest: boolean = environment.production;

  @ViewChildren('theLastList', { read: ElementRef }) theLastList: QueryList<ElementRef>;
  observer: IntersectionObserver;

  hasMore = true;
  loading = signal(false);
  totalPages = 0;
  currentPage = 0;
  limitPage = 20;

  // search chat
  search: string | null;
  myFormSearch: FormGroup;

  //  component
  private messageBroadcastChatRef: ComponentRef<MessageBroadcastChatComponent> | null = null;

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();
  selectedRowIndex: number | null = null;

  private translate = inject(TranslateService);
  public chatService = inject(ChatService);
  public messageService = inject(MessageService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  public document = inject(DOCUMENT);
  private location = inject(Location);
  public router = inject(Router);
  private socketService = inject(SocketService);
  private activeRoute = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private applicationRef = inject(ApplicationRef);
  private toolsService = inject(ToolsService);
  private title = inject(Title);
  public dialogService = inject(DialogService);
  private toastService = inject(ToastService);

  constructor() {
    this.title.setTitle('Chats');
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.search = this.activeRoute.snapshot.queryParamMap.get('q');

  }

  ngOnInit() {
    if (this.isBrowser && this.authService.user()) {
      this.createFormControls();
      this.findByIdUser();
    }

  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.destroy$.next();
      this.destroy$.complete();
      // components
      this.clearMessageBroadcastComponent();
    }
  }

  ngAfterViewInit() {

  }

  createFormControls() {
    this.myFormSearch = this.fb.group({
      q: [null, Validators.required],
    });
  }

  findByIdUser(): void {
    if (!this.hasMore) return;
    this.loading.set(true);

    let data: any = {};
    if (this.search) {
      data = {
        search: this.search,
      }
    }

    this.chatService.findByIdUser(data, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && res?.data.length > 0) {

            if (this.currentPage === 0) {
              this.chatService.resetChats();
              this.totalPages = res.total;
            }

            const currentItems = this.chatService.chats();

            // 1. Filtramos los duplicados
            const newPosts = res.data.filter((newPost: Chat) =>
              !currentItems.some(existing => existing._id === newPost._id)
            );

            // 2. Combinamos y ORDENAMOS en un solo paso antes de actualizar la Signal
            const updatedItems = [...currentItems, ...newPosts].sort((a, b) => {
              const fechaA = new Date(a.lastMessageAt!).getTime();
              const fechaB = new Date(b.lastMessageAt!).getTime();
              return fechaB - fechaA; // Descendente
            });

            // 3. Una sola actualización de estado para todo
            this.chatService.addChats(updatedItems);

            // this.hasMore = this.currentPage <= this.totalPages;
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
        this.findByIdUser();
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

  getProfileImageUrl(user: User): string {
    const userProfile = user;
    if (!userProfile || !userProfile.Profile || userProfile.Profile.length === 0) {
      return '';
    }

    const profile = userProfile.Profile[0];

    if (profile.cloudflare && profile.cloudflare.result && profile.cloudflare.result.variants && profile.cloudflare.result.variants.length > 0) {
      return profile.cloudflare.result.variants[0];
    }

    return profile.url || '';
  }

  onReceiver(item: Chat): void {
    this.messageService.resetUserReceiver();
    this.messageService.addUserReceiver(item.User!);
    this.chatService.addChat(item);
  }

  onSubmitSearch(): void {
    this.router.navigate(['chats'], { queryParams: { q: this.myFormSearch.value.q } });

    this.search = this.myFormSearch.value.q;

    this.limitPage = 15;
    this.currentPage = 0;
    this.hasMore = true;

    this.chatService.resetChats();
    this.findByIdUser();
  }

  onCreateMessageBroadcast() {
    this.onCreateMessageBroadcastModal();
  }

  onRowClick(index: number): void {
    this.selectedRowIndex = this.selectedRowIndex === index ? null : index;
  }

  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  goBack(): void {
    this.location.back();
  }

  //modal external
  onCreateMessageBroadcastModal() {

    const user = this.authService.user()!;
    if (user.status === 'SUSPENDED') {
      this.toastService.start({ type: 'error', message: 'accountSuspended' });
      return;
    }

    this.clearMessageBroadcastComponent();

    const componentRef = this.viewContainerRef.createComponent(MessageBroadcastChatComponent);

    this.messageBroadcastChatRef = componentRef;

    componentRef.instance.closeModal.subscribe(() => {
      this.clearMessageBroadcastComponent();
      this.dialogService.closeModal();
    });

    this.dialogService.toggleModal('messageBroadcast');
  }

  private clearMessageBroadcastComponent() {
    if (this.messageBroadcastChatRef) {
      this.messageBroadcastChatRef.destroy();
      this.messageBroadcastChatRef = null;
    }
  }
  // modal
  onCloseModal() {
    this.dialogService.closeModal();
  }

  getFirstLetter(name: string): string {
    return this.toolsService.getFirstLetter(name);
  }

  getUserColor(userId: string): string {
    if (!userId) return '#a1a1aa'; // Color zinc-400 por defecto si no hay ID

    // Paleta de colores vivos y modernos estilo WhatsApp / Telegram
    const colors = [
      '#10b981', // Esmeralda
      '#06b6d4', // Cían
      '#3b82f6', // Azul
      '#6366f1', // Índigo
      '#8b5cf6', // Violeta
      '#ec4899', // Rosa
      '#f43f5e', // Rosa fuerte
      '#f97316', // Naranja
      '#eab308', // Ámbar
      '#14b8a6'  // Teja/Turquesa
    ];

    // Generamos un número único sumando los códigos ASCII de los caracteres del ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Obtenemos el índice del array usando el residuo de la división
    const index = Math.abs(hash) % colors.length;
    return colors[index];
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

  cardModalClass() {
    return UIStyles.cardModalClass();
  }

  buttonClass() {
    return UIStyles.buttonClass();
  }

  modalClass() {
    return UIStyles.modalClass();
  }
}
