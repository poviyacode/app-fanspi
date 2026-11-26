import { CommonModule, isPlatformBrowser, isPlatformServer, NgOptimizedImage } from '@angular/common';
import { ApplicationRef, Component, ComponentRef, effect, ElementRef, HostListener, inject, OnInit, PLATFORM_ID, signal, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '@environments/environment';
import { SeoService } from '@services/seo.service';
import { MetaTag } from '@interfaces/metaTags';
import { UserService } from '@services/user.service';
import { first, Subject, takeUntil } from 'rxjs';
import { User } from '@interfaces/user';
import { ToastService } from '@services/toast.service';
import videojs from 'video.js';
import { DialogService } from '@services/dialog.service';
import { SpinnerService } from '@services/spinner.service';
import { TipService } from '@services/tip.service';
import { PostService } from '@services/post.service';
import { PostMedia } from '@interfaces/postMedia';
import { AuthService } from '@services/auth.service';
import { SubscriptionService } from '@services/subscription.service';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { Post } from '@interfaces/post';
import { ReadMoreComponent } from '@library/read-more/read-more.component';
import { UIStyles } from '@core/common/uistyles';
import { Bookmark } from '@interfaces/bookmark';
import { BookmarkService } from '@services/bookmark.service';
import { DropdownPostComponent } from '@layout/post/pages/dropdown-post/dropdown-post.component';
import { CommentsPostComponent } from '@layout/post/pages/comments-post/comments-post.component';
import { TipComponent } from '@shared/tip/tip.component';
import { MessageService } from '@services/message.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { ToolsService } from '@services/tools.service';

@Component({
  selector: 'app-media-chat',
  imports: [
    CommonModule,
    RouterModule,
    IconDirective,
    CustomTranslatePipe
  ],
  animations: [
    trigger('flyInOut', [
      state('in', style({ transform: 'translateX(0) scale(1)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateX(0) scale(0.95)', opacity: 0 }),
        animate('400ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({ transform: 'translateX(0) scale(1)', opacity: 1 }))
      ]),
      transition('* => void', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0) scale(0.95)', opacity: 0 }))
      ]),
    ]),
  ],
  templateUrl: './media-chat.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './media-chat.component.scss'
})
export default class MediaChatComponent {

  isBrowser: boolean;
  isServer: boolean;
  private destroy$ = new Subject<void>();

  // container
  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;

  // video
  @ViewChild('videoElement', { static: true }) videoElement!: ElementRef;
  player!: any;
  isPlaying: boolean = true; // Estado de reproducción
  videoUrl: SafeResourceUrl | undefined;
  isLoadingVideo = signal(false);

  // index
  currentLinghtbox = signal<PostMedia | null>(null);
  mediaCurrentIndex = 0;
  postCurrentIndex: number;

  //touch
  touchStartX: number = 0;
  touchStartY: number = 0;
  changeOccurred: boolean = false;

  //read more
  showFullText = signal(false);

  private platformId = inject(PLATFORM_ID);
  private activatedRoute = inject(ActivatedRoute);
  private seoService = inject(SeoService);
  public userService = inject(UserService);
  public toastService = inject(ToastService);
  private applicationRef = inject(ApplicationRef);
  public dialogService = inject(DialogService);
  private spinnerService = inject(SpinnerService);
  private tipService = inject(TipService);
  postService = inject(PostService);
  messageService = inject(MessageService);
  authService = inject(AuthService);
  subscriptionService = inject(SubscriptionService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  private bookmarkService = inject(BookmarkService);
  private toolsService = inject(ToolsService);

  // components
  private tipComponentRef: ComponentRef<TipComponent> | null = null;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    const slug = this.activatedRoute.snapshot.paramMap.get('slug');

    if (slug) {
      effect(() => {

        if (this.postService.post()) {

          this.mediaCurrentIndex = this.postService.post()!.currentIndex! ? this.postService.post()!.currentIndex! : 0;

          if (this.postService.post()!.PostMedia!.length! > 0) {
            this.currentLinghtbox.set(this.postService.post()!.PostMedia!![this.mediaCurrentIndex]);
          }

          if (this.postService.postsSwiping().length > 0) {
            this.postCurrentIndex = this.postService.postsSwiping()!.findIndex(post => post._id === this.postService.post()!._id);
          }

          this.updateVideoUrl();

        }
      });

      if (this.postService.post()?.slug !== slug) {
        this.postService.resetPost();
        this.findOneSlug(slug);
      } else {
        this.spinnerService.close();
      }
    }

    this.lockScroll();
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.applicationRef.isStable.pipe(first(stable => stable)).subscribe(() => {

      });
    }
  }

  ngAfterViewInit() {
    this.updateVH();
    window.addEventListener('resize', this.updateVH);

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    window.removeEventListener('resize', this.updateVH);

    this.unlockScroll();

    this.destroyVideoPlayer();

    //reset
    this.resetPost();
  }

  //message
  findOneSlug(slug: string): void {
    this.spinnerService.start();

    this.messageService.findOne(this.postService.post()?._id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.postService.addPost(res);

            // if (this.authService.user() && this.postService.post()?.BookmarkUser?.User?._id === this.authService.user()?._id) {
            //   this.postService.updatePosts(res._id, {
            //     BookmarkUser: res.BookmarkUser
            //   })
            // }

            this.updateVideoUrl();
            this.headPage(res.post);
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
        },
        complete: () => {
          this.spinnerService.close();
          console.log('Request completed');
        }
      });
  }

  getCurrentSlideNumber(): number {
    return this.mediaCurrentIndex + 1;
  }

  getTotalSlideCount(): number {
    return this.postService.post()!.PostMedia!.length;
  }

  nextPost() {

    // Si es el último video, vuelve al primero
    //if (this.postCurrentIndex < this.postService.postsSwiping().length - 1) {
    this.postCurrentIndex = (this.postCurrentIndex + 1) % this.postService.postsSwiping().length;
    this.postService.addPost(this.postService.postsSwiping()[this.postCurrentIndex]);
    //this.router.navigate([this.postService.post()!.User?.username, 'pu', this.postService.post()!.slug]);
    //}

    // Verificar si el nuevo media es video
    const currentMedia = this.postService.post()!.PostMedia![this.mediaCurrentIndex];
    if (currentMedia?.type !== 'video') {
      this.pauseVideo();
    }

    this.updateVideoUrl();
  }

  prevPost() {

    // Si es el primer video, vuelve al último
    //if (this.postCurrentIndex > 0) {
    this.postCurrentIndex = (this.postCurrentIndex - 1 + this.postService.postsSwiping().length) % this.postService.postsSwiping().length;
    this.postService.addPost(this.postService.postsSwiping()[this.postCurrentIndex]);
    //this.router.navigate([this.postService.post()!.User?.username, 'pu', this.postService.post()!.slug]);
    //}

    // Verificar si el nuevo media es video
    const currentMedia = this.postService.post()!.PostMedia![this.mediaCurrentIndex];
    if (currentMedia?.type !== 'video') {
      this.pauseVideo();
    }

    this.updateVideoUrl();
  }

  prevCarouselMedia() {
    this.mediaCurrentIndex = this.mediaCurrentIndex === 0 ? this.postService.post()!.PostMedia!.length - 1 : this.mediaCurrentIndex - 1;
    this.currentLinghtbox.set(this.postService.post()!.PostMedia![this.mediaCurrentIndex]);
    this.pauseVideo();
    this.updateVideoUrl();
  }

  nextCarouselMedia() {
    this.mediaCurrentIndex = (this.mediaCurrentIndex + 1) % this.postService.post()!.PostMedia!.length;

    this.currentLinghtbox.set(this.postService.post()!.PostMedia![this.mediaCurrentIndex]);
    this.pauseVideo();
    this.updateVideoUrl();
  }

  updateVideoUrl() {

    const postMedia: PostMedia = this.postService.post()!.PostMedia![this.mediaCurrentIndex];

    if (postMedia?.type === 'video') {
      const postMedia = this.postService.post()!.PostMedia![this.mediaCurrentIndex];
      const videoSrc = postMedia.cloudflare.result.playback.hls;
      const videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoSrc)
      this.initVideoPlayer(videoSrc);
    }
  }


  verifiedPrivate() {
    let currentPrivate = false;

    const typeView = this.messageService.message()?.typeView;
    const SenderId = this.messageService.message()?.Sender;
    if (typeView === 'FREE' || this.authService?.user()?._id === SenderId) {
      currentPrivate = false;
    } else if (typeView === 'UNPAID') {
      currentPrivate = true;
    } else if (typeView === 'PAID') {
      currentPrivate = false;
    }

    return currentPrivate;
  }

  // modal
  closeModal() {

    this.resetPost();

    if (this.postService.post()?.route!) {
      this.router.navigateByUrl(this.postService.post()?.route!);
    } else {
      this.router.navigateByUrl(this.postService.post()?.User?.username!);
    }

  }

  resetPost() {
    this.dialogService.closeModal();
    const dataUpdate = {};
    this.postService.latestPost(dataUpdate).subscribe();

    this.unlockScroll();

  }

  // video
  private initVideoPlayer(videoUrl: string): void {
    if (this.isBrowser) {
      this.isPlaying = true;
      // Cambiar el video después de actualizar el índice

      //const postMedia = this.postService.post()!.PostMedia![this.mediaCurrentIndex];
      //const videoSrc = postMedia.cloudflare.result.playback.hls;
      const videoSrc = videoUrl;

      // Verificar si ya existe un reproductor y eliminarlo antes de inicializar uno nuevo
      if (this.player) {
        //this.player.dispose();
        this.player = null;
      }

      this.player = videojs(this.videoElement.nativeElement, {
        controls: false, // Deshabilitar controles principales
        autoplay: true,
        loop: true,
        muted: false,
        preload: 'auto',
        inactivityTimeout: 0, // Evita que aparezcan controles al mover el mouse
        userActions: {
          doubleClick: false, // Deshabilita la acción de doble click
          hotkeys: false // Deshabilita atajos de teclado
        }
      });

      this.player.tech_.setControls(false); // Deshabilita controles nativos del navegador
      this.player.userActive(false); // Evita estados activos del usuario

      if (videoSrc) {
        this.player.src({ src: videoSrc, type: 'application/x-mpegURL' });
      }

      // Manejar eventos de carga
      this.player.on('waiting', () => this.handleLoading());
      this.player.on('playing', () => this.handleLoaded());
      this.player.on('loadstart', () => this.handleLoading());
      this.player.on('loadeddata', () => this.handleLoaded());
      this.player.on('canplay', () => this.handleLoaded());
      this.player.on('canplaythrough', () => this.handleLoaded());

      this.player.ready(() => {
        this.player.play().catch(() => {
          console.warn('Autoplay bloqueado, esperando interacción del usuario...');
        });
      });

    }
  }

  private handleLoading(): void {
    if (!this.isLoadingVideo()) {
      this.isLoadingVideo.set(true);
      this.applicationRef.tick(); // Forzar actualización de la UI
      console.log('El video está cargando...');
    }
  }

  private handleLoaded(): void {
    if (this.isLoadingVideo()) {
      this.isLoadingVideo.set(false);
      this.applicationRef.tick(); // Forzar actualización de la UI
      console.log('El video ha cargado suficiente contenido');
    }
  }

  // Método para verificar estado de carga actual
  checkBufferingState(): boolean {
    if (!this.player) return false;

    // Verificar el estado de la red
    const networkState = this.player.networkState();
    const isBuffering = this.player.hasClass('vjs-waiting');

    return this.isLoadingVideo() || networkState === 2 || isBuffering;
  }


  // Obtener porcentaje de buffer
  getBufferedPercentage(): number {
    if (!this.player) return 0;

    const duration = this.player.duration();
    const buffered = this.player.buffered();

    if (!buffered || duration === 0) return 0;

    return (buffered.end(buffered.length - 1) / duration) * 100;
  }

  // Verificar si está buscando (buffering activo)
  isSeeking(): boolean {
    return this.player && this.player.seeking();
  }

  // Obtener tiempo de buffer restante
  getRemainingBufferTime(): number {
    if (!this.player) return 0;

    const currentTime = this.player.currentTime();
    const buffered = this.player.buffered();

    if (!buffered || buffered.length === 0) return 0;

    return buffered.end(buffered.length - 1) - currentTime;
  }

  playVideo(): void {
    if (this.player) {
      this.player.play();
    }
  }

  pauseVideo(): void {
    if (this.player) {
      this.player.pause();
    }
  }

  togglePlayPause(): void {
    if (this.player) {
      if (this.isPlaying) {
        this.player.pause();
      } else {
        this.player.play();
      }
      this.isPlaying = !this.isPlaying; // Cambiar el estado
    }
  }

  private destroyVideoPlayer(): void {
    if (this.player) {
      this.player.off('waiting');
      this.player.off('playing');
      this.player.off('loadstart');
      this.player.off('loadeddata');
      this.player.off('canplay');
      this.player.off('canplaythrough');
      this.player.dispose();
      this.player = null;
    }
    this.videoUrl = undefined; // Limpiar la URL del video
  }

  // touch
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.changeOccurred = false;
  }

  onTouchMove(event: TouchEvent): void {

    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;
    const deltaX = this.touchStartX - touchEndX;
    const deltaY = this.touchStartY - touchEndY;

    if (!this.changeOccurred) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
        if (deltaX > 0) {
          this.nextCarouselMedia(); // Deslizó a la izquierda
        } else {
          this.prevCarouselMedia(); // Deslizó a la derecha
        }
        this.changeOccurred = true;
      }
      else if (Math.abs(deltaY) > 5) { // Si es un movimiento vertical
        if (deltaY > 0) {
          this.nextPost(); // Deslizó hacia arriba
        } else {
          this.prevPost(); // Deslizó hacia abajo
        }
        this.changeOccurred = true;

      }
    }
  }

  // scroll x y
  onScroll(event: WheelEvent) {

    if (event.deltaY > 0) {
      this.nextPost(); // Deslizó hacia arriba
    } else {
      this.prevPost(); // Deslizó hacia abajo
    }

  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {

    if (event.key === 'ArrowUp') {
      this.nextPost(); // Deslizó hacia arriba
    } else if (event.key === 'ArrowDown') {
      this.prevPost(); // Deslizó hacia abajo
    } else if (event.key === 'ArrowLeft') {
      this.prevCarouselMedia();
    } else if (event.key === 'ArrowRight') {
      this.nextCarouselMedia();
    } else if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  // hidden scroll
  updateVH() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }

  lockScroll() {
    document.body.style.overflow = 'hidden';
  }

  unlockScroll() {
    document.body.style.overflow = 'auto';
  }

  // seo 
  headPage(post?: Post) {

    let mediaUrl = '';

    if (post?.PostMedia?.length! > 0) {
      if (post?.PostMedia![0].type === 'image') {
        mediaUrl = post.PostMedia![0].cloudflare ? post.PostMedia![0].cloudflare.result.variants[0] : post.PostMedia![0].url;
      } else if (post?.PostMedia![0].type === 'video') {
        mediaUrl = 'https://customer-6kruyx7h361tmu11.cloudflarestream.com/' + post.PostMedia![0].cloudflare.result.uid + '/thumbnails/thumbnail.jpg';
      } else {
        mediaUrl = `${environment.domain}/assets/logo/dating.jpg`;
      }
    } else {
      mediaUrl = `${environment.domain}/assets/logo/dating.jpg`;
    }
    const data: MetaTag = {
      title: post?.title || post?.description || `${'Hot sex 👉👌😋'}`,
      description: post?.title ? post?.description : `I'm hot I want to fuck 👉👌😋`,
      path: `${post?.slug}`,
      image: mediaUrl
    };

    this.seoService.updateMetaTags(data);
  }

  // dropdown
  onModalDropdown(post: Post) {

    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(DropdownPostComponent);
    componentRef.instance;


    this.dialogService.toggleModal('dropdownPost');
    this.postService.addPost(post);

  }

  // comments
  onCommentDialog(post: Post) {
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(CommentsPostComponent);
    componentRef.instance;

    this.dialogService.toggleModal('commentPost');
    this.postService.addPost(post);
  }

  // tip
  onTipDialog(post: Post) {
    const dataTip: any = {
      type: 'TIP',
      post: post,
      user: post.User
    };
    this.tipService.addTip(dataTip);
    this.dialogService.toggleModal('tipCredit');
  }

  // like
  onLikes(post: Post) {
    if (!post || !this.authService.user()) return;

    const likeUpdate = Number(post.likes! + 1);

    this.postService.post()!.likes = likeUpdate;
    this.postService.updatePosts(post._id!, { likes: likeUpdate });

    this.postService.likes(post._id!, { likes: likeUpdate }).pipe(takeUntil(this.destroy$)).subscribe();
  }

  // share
  share(post: Post) {
    if (navigator.share) {
      navigator.share({
        title: post.description !== null ? post.description : `I'm hot, fuck me 👉👌😋`,
        text: `I want to have sex with you, soft and hard 👉👌😋`,
        url: `https://${environment.domain}/pu/` + post.slug
      })
        .then(() => console.log('Content shared successfully'))
        .catch((error) => console.log('Error al share:', error));
    } else {
      console.log('The Web Share API is not available in this browser');
    }
  }

  // read more
  isTextLong(text: string): boolean {
    const maxLength = 39;
    return text.length > maxLength;
  }

  toggleText(): void {
    this.showFullText.set(!this.showFullText());
  }

  // inner
  innerText(text: any) {
    return UIStyles.innerText(text);
  }

  // text
  textMessage(item: Post) {
    return `Hola, acabo de ver tu anuncio en ${environment.domain}, `
      + UIStyles.cropText(item.title!, 25) + '(...)' +
      ", quiero una cita contigo."
      + ` https://${environment.domain}/pu/` + item.slug;
  }

  // Sanitizar el HTML
  getSafeHtml(text: string): SafeHtml {
    text = UIStyles.innerText(text);
    const textHtml = this.sanitizer.bypassSecurityTrustHtml(text);
    return textHtml;
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

  getFirstLetter(name: string): string {
    return this.toolsService.getFirstLetter(name);
  }


}
