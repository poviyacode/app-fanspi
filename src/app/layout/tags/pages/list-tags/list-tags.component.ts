import { AfterViewInit, Component, ComponentFactoryResolver, computed, effect, ElementRef, HostListener, inject, Inject, OnInit, PLATFORM_ID, QueryList, signal, Signal, ViewChild, ViewChildren, ViewContainerRef, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { PostService } from '@services/post.service';
import { AuthService } from '@services/auth.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';;
import { SubscriptionService } from '@services/subscription.service';
import { SpinnerService } from '@services/spinner.service';
import { environment } from '@environments/environment';
import { CounterService } from '@services/counter.service';
import { TipService } from '@services/tip.service';
import { SugestionsComponent } from '@shared/sugestions/sugestions.component';
import { DialogService } from '@services/dialog.service';
import { CommentsPostComponent } from '@layout/post/pages/comments-post/comments-post.component';
import { PipesModule } from '@pipes/pipes.module';
import { CustomTranslatePipe, TranslateService } from '@ngx-translate/core';
import { Tools } from '@core/common/tools';
import { ReadMoreComponent } from '@library/read-more/read-more.component';
import { Post } from '@interfaces/post';
import { Subscription } from '@interfaces/subscription';
import { DirectiveModule } from '@directive/directive.module';
import { TipComponent } from '@shared/tip/tip.component';
import { ModalPostComponent } from '@layout/post/pages/modal-post/modal-post.component';
import { DropdownPostComponent } from '@layout/post/pages/dropdown-post/dropdown-post.component';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { SearchOuterComponent } from '@layout/search/search-outer/search-outer.component';
import { SeoService } from '@services/seo.service';
import { MetaTag } from '@interfaces/metaTags';
import { ToastService } from '@services/toast.service';
import { ToolsService } from '@services/tools.service';

@Component({
  selector: 'app-list-tags',
  imports: [
    CommonModule,
    RouterModule,
    CustomTranslatePipe,
    PipesModule,
    DirectiveModule,
  ],
  templateUrl: './list-tags.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./list-tags.component.scss']
})
export default class ListTagsComponent {

  isBrowser: boolean;
  isServer: boolean;

  @ViewChildren('theLastList', { read: ElementRef }) theLastList: QueryList<ElementRef>;
  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;

  showButton = false;
  scrollHeight = 400;

  loading = false;

  posts: Post[] = [];
  post: Post;

  tag: string | null;

  currentPage = 0;
  limitPage = 8;
  totalPages = 0;
  hasMore: boolean = true;

  dataSearch: any;
  isFirstElement = true;
  isPost: boolean;

  subscription: Subscription | null;
  subscribersJoin: Subscription[] = [];

  private destroy$ = new Subject<void>();

  postLoading: string[] = ["hola", "que", "tal", "hola", "que", "tal", "hola", "que"];

  private translateService = inject(TranslateService);
  public postService = inject(PostService);
  public authService = inject(AuthService);
  public router = inject(Router);
  private document = inject(DOCUMENT);
  public dialogService = inject(DialogService);
  private subscriptionService = inject(SubscriptionService);
  private platformId = inject(PLATFORM_ID);
  public counterService = inject(CounterService);
  public tipService = inject(TipService);
  private seoService = inject(SeoService);
  private toastService = inject(ToastService);
  private activatedRoute = inject(ActivatedRoute);

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    if (this.authService.user()!) {
      effect(() => {
        this.subscribersJoin = this.subscriptionService.subscribersUserJoin();
      });
    }

    this.activatedRoute.paramMap.subscribe((params) => {
      this.tag = params.get('tag');
    });

  }

  ngOnInit(): void {
    this.postService.resetPosts();
    this.findAllPosts();
    this.headPage();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {

  }

  // find
  findAllPosts() {
    if (this.loading || !this.hasMore) return;

    this.loading = true;
    const dataSearch = {
      search: this.tag,
    };

    this.postService.findAllSearchPosts(dataSearch, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && res.data.length > 0) {

            if (this.currentPage === 0) {
              this.totalPages = res.total;
            }

            const currentPosts = this.postService.posts();
            const newPosts = res.data.filter((newPost: Post) => {
              return !currentPosts.some(existingPost => existingPost._id === newPost._id);
            });
            const updatedPosts = [...currentPosts, ...newPosts];
            this.postService.addPosts(updatedPosts);
            this.posts = this.postService.posts();
            this.hasMore = res.data.length <= this.limitPage;
          } else {
            this.hasMore = false;
          }
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
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
        this.findAllPosts();
      }
    }
  }

  // seo
  headPage() {
    const data: MetaTag = {
      title: `Explore content tagged "${this.tag}"`,
      description: `Find the best content under the "${this.tag}" tag. Dive into a wide range of posts and engage with creators who are passionate about "${this.tag}".`,
      path: `tags/${this.tag}`,
      image: `https://${environment.domain}/public/logo/seo2.jpg`
    };
    this.seoService.updateMetaTags(data);
  }

  // comments
  onCommentDialog(post: Post) {
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(CommentsPostComponent);
    componentRef.instance;

    this.dialogService.toggleModal('commentPost');
    this.postService.addPost(post);
  }

  // dropdown
  closeModalDropdown() {
    this.dialogService.closeModal();
    const dataUpdate = {};
    this.postService.latestPost(dataUpdate).subscribe();
  }

  onModalDropdown(post: Post) {

    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(DropdownPostComponent);
    componentRef.instance;


    this.dialogService.toggleModal('dropdownPost');
    this.postService.addPost(post);

  }

  //  pin to tops
  onPinToTop(item: Post): void {
    if (this.authService.user()!?._id === item.User?._id) {
      const data = {
        pined: item.pined == true ? false : true,
      };
      this.dialogService.closeModal();
      this.postService.updatePined(item._id!, data).subscribe(res => {
        const postToUpdate = this.posts.find((post) => post._id === item._id);
        if (postToUpdate) {
          postToUpdate.pined = item.pined == true ? false : true;
        }
      });
    }
  }

  // tip
  onTipDialog(post: Post) {

    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(TipComponent);
    componentRef.instance;

    this.dialogService.toggleModal('tip');

    const dataTip = {
      type: 'TIP_POST',
      post: post,
      user: post.User
    };
    this.tipService.addTip(dataTip);
  }

  // subscription
  subscriptionExpiredQuery(item: Post) {
    let currentPrivate = false;

    const media = item;
    const typeView = media?.typeView;

    if (typeView === 'FREE' || this.authService?.user()?._id === media?.User?._id) {
      currentPrivate = false;
    } else {
      if (media) {
        const subscription = this.subscriptionService.searchSubscribersUserJoin(media.User?.username!);
        if (!subscription) {
          currentPrivate = true;
        }
      }
    }
    return currentPrivate;
  }

  getContentForSuscribe(): string {
    const subscribeContent = `
      <div class="absolute inset-0 text-white backdrop-blur-3xl bg-zinc-100/50 dark:bg-zinc-800/50 m-0 flex flex-col justify-center items-center space-y-2">
        <div class="flex justify-center items-center space-x-1">
          <i class="fa-solid fa-lock"></i>
          <span>${this.translateService.instant('suscribe')}</span>
        </div>
      </div>
    `;

    return subscribeContent;
  }

  // dialog post
  closeModalPost() {
    this.dialogService.closeModal();
    const dataUpdate = {};
    this.postService.latestPost(dataUpdate).subscribe();
  }

  onModalPost(post: Post) {
    this.postService.addPost(post);
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(ModalPostComponent);
    componentRef.instance;
    this.dialogService.toggleModal('modalPost');
  }

  // image or video url
  getImageUrl(item: any): string {
    if (item.PostMedia![0].cloudflare) {
      return item.PostMedia![0].cloudflare.result.variants[0];
    } else {
      return item.PostMedia![0].url;
    }
  }

  getVideoThumbnailUrl(item: any): string {
    if (this.subscriptionExpiredQuery(item)) {
      return item.PostMedia![0].cloudflare
        ? `https://customer-6kruyx7h361tmu11.cloudflarestream.com/${item.PostMedia![0].cloudflare.result.uid}/thumbnails/thumbnail.gif?time=1s&height=200&duration=10s`
        : item.PostMedia![0].urlSnapshot;
    } else {
      return item.PostMedia![0].cloudflare
        ? `https://customer-6kruyx7h361tmu11.cloudflarestream.com/${item.PostMedia![0].cloudflare.result.thumbnail}`
        : item.PostMedia![0].urlSnapshot;
    }
  }

  getVideoPlaceholderUrl(item: any): string {
    return item.PostMedia![0].cloudflare
      ? `https://customer-6kruyx7h361tmu11.cloudflarestream.com/${item.PostMedia![0].cloudflare.result.thumbnail}`
      : item.PostMedia![0].urlSnapshot;
  }

  onUpdateClick(id: string, clickType: string) {

    const data = {
      Post: id,
      clickType: clickType
    }
    //this.postAdService.updateClick(data).toPromise();
  }

  // likes
  onLikes(post: Post) {
    if (post && this.authService.user()!) {
      const data = {};

      // Encontrar el índice del objeto Post en la matriz
      const index = this.posts.findIndex((item: Post) => item._id === post._id);

      // Si se encuentra el objeto en la matriz, actualizar el dato
      if (index !== -1) {
        this.posts[index].likes! += 1;
      }

      this.postService.likes(post._id!, data).subscribe(res => {
        if (res) {

        }
      });
    }
  }

  // share

  shareTag() {
    if (navigator.share) {
      navigator.share({
        title: this.tag!,
        text: `I want to have sex with you, soft and hard 👉👌😋`,
        url: `https://${environment.domain}/tags/${this.tag}`
      })
        .then(() => console.log('Content shared successfully'))
        .catch((error) => console.log('Error al share:', error));
    } else {
      console.log('The Web Share API is not available in this browser');
    }
  }

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

  // scroll
  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  // inner
  innerText(text: any) {
    return Tools.innerText(text);
  }

  // text
  textMessage(item: Post) {
    return `Hola, acabo de ver tu anuncio en ${environment.domain}, `
      + Tools.cropText(item.title!, 25) + '(...)' +
      ", quiero una cita contigo."
      + `https://${environment.domain}/pu/` + item.slug;
  }

  onLogin(): void {
    this.router.navigate(['/auth/login']);
  }

}
