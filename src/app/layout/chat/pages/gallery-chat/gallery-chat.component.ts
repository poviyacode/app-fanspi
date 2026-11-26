import { AfterViewInit, Component, ElementRef, HostListener, inject, Inject, Input, OnDestroy, OnInit, PLATFORM_ID, QueryList, signal, ViewChild, ViewChildren, ViewContainerRef, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { isPlatformBrowser, isPlatformServer, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Chat } from '@interfaces/chat';
import { User } from '@interfaces/user';
import { PostMedia } from '@interfaces/postMedia';
import { DialogService } from '@services/dialog.service';
import { AuthService } from '@services/auth.service';
import { SocketService } from '@services/socket.service';
import { MessageService } from '@services/message.service';
import { TipService } from '@services/tip.service';
import { ToastService } from '@services/toast.service';
import { SpinnerService } from '@services/spinner.service';
import { PostMediaService } from '@services/post-media.service';
import { PaymentOrderService } from '@services/payment-order.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { ChatService } from '@services/chat.service';
import { environment } from '@environments/environment';
import { Subject, takeUntil } from 'rxjs';
import { PostService } from '@services/post.service';
import { ModalPostComponent } from '@layout/post/pages/modal-post/modal-post.component';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-gallery-chat',
  imports: [
    CustomTranslatePipe,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './gallery-chat.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./gallery-chat.component.scss']
})
export default class GalleryChatComponent {

  isBrowser: boolean;
  isServer: boolean;

  loading: boolean;
  showButton = false;
  scrollHeight = 400;

  search: string | null;
  idChat: string | null;
  chat: Chat;
  receiver: User | undefined;
  url: string | null;
  gallery: any;

  totalImage = signal<number>(0);
  totalVideo = signal<number>(0);

  totalPages: number = 0;
  currentPage = 0;
  limitPage = 5;
  hasMore: boolean = true;

  postLoading: string[] = ["hola", "que", "tal", "hola", "que", "tal"];
  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();

  private dialogService = inject(DialogService);
  private route = inject(ActivatedRoute);
  public authService = inject(AuthService);
  public router = inject(Router);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  public postService = inject(PostService);
  public postMediaService = inject(PostMediaService);
  public chatService = inject(ChatService);
  private location = inject(Location);
  public document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private activatedRoute = inject(ActivatedRoute);

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    this.idChat = this.route.snapshot.paramMap.get('idChat');

    this.activatedRoute.paramMap.subscribe(params => {
      this.url = params.get('status') || '';
      if (this.authService.user()) {
        this.loading = false;
        this.hasMore = true;
        this.postMediaService.resetPostMedias();
        this.findMedia();
      }
    });
  }

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async findMedia() {
    this.loading = true;
    const data = {
      Chat: this.idChat,
      'type': this.url ? this.url : '',
      'Site': environment.site,
    }

    this.chatService.findAllChatMedia(data, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {

            if (res && res.data.length > 0) {

              if (this.currentPage === 0) {
                this.chatService.addChat(res.Chat);
                this.totalPages = res.totalPages;
                this.totalImage.set(res.totalImage);
                this.totalVideo.set(res.totalVideo);
              }

              const currents = this.postMediaService.postMedias();
              const newItems = res.data.filter((newITem: Chat) => {
                return !currents.some(existing => existing._id === newITem._id);
              });
              const updatedItem = [...currents, ...newItems];
              this.postMediaService.addPostMedias(updatedItem);

              this.hasMore = this.currentPage <= this.totalPages;

            } else {
              this.hasMore = false;
            }
            this.loading = false;
          }
        },
        error: (err) => {
          this.loading = false;
        },
        complete: () => {
          console.log('Request completed');
        }
      });
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      if (this.hasMore && !this.loading) {
        this.currentPage = this.currentPage + this.limitPage;
        this.findMedia();
      }
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const yOffset = window.pageYOffset;
    const scrollTop = this.document.documentElement.scrollTop;
    this.showButton = (yOffset || scrollTop) > this.scrollHeight;

  }

  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  onScrollDown(): void {
    //console.log('Down')
  }

  goBack(): void {
    this.location.back();
  }

  subscriptionExpiredQuery(item: PostMedia): boolean {

    if (item.Message?.typeView == 'FREE' || item.Message?.typeView == 'PAID') {
      return false;
    }

    const isAuthenticated = !!this.authService.user()!;
    const isSameUser = isAuthenticated && this.authService.user()! && this.authService.user()!._id === item.User?._id;
    if (isAuthenticated && !isSameUser) {
      return true;
    } else {
      return false;
    }

  }

  onModalPost(item: PostMedia, currentIndex: number) {

    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(ModalPostComponent);
    componentRef.instance;

    this.dialogService.toggleModal('modalPost');

    const post = {
      User: item.User,
      PostMedia: this.postMediaService.postMedias(),
      currentIndex: currentIndex,
    };
    this.postService.addPost(post);

  }

  isRouteActive(route: string): boolean {
    console.log(route)
    return this.router.isActive(route, false);
  }
}
