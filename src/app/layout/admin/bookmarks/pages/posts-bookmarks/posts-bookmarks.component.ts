import { CommonModule, isPlatformBrowser, isPlatformServer, Location, NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, HostListener, inject, Inject, OnInit, PLATFORM_ID, QueryList, signal, ViewChild, ViewChildren, ViewContainerRef, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { Bookmark } from '@interfaces/bookmark';
import { Post } from '@interfaces/post';
import { ModalPostComponent } from '@layout/post/pages/modal-post/modal-post.component';
import { SpinnerService } from '@services/spinner.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { BookmarkService } from '@services/bookmark.service';
import { DialogService } from '@services/dialog.service';
import { PostService } from '@services/post.service';
import { SubscriptionService } from '@services/subscription.service';
import { Subject, takeUntil } from 'rxjs';
import { IconDirective } from '@directive/coin-svg.directive';
import { User } from '@interfaces/user';
import { ToolsService } from '@services/tools.service';

@Component({
  selector: 'app-posts-bookmarks',
  imports: [NgOptimizedImage,
    CommonModule,
    CustomTranslatePipe,
    IconDirective,
    RouterModule,
  ],
  templateUrl: './posts-bookmarks.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./posts-bookmarks.component.scss']
})
export default class PostsBookmarksComponent {

  isBrowser: boolean;
  isServer: boolean;

  showButton = false;
  scrollHeight = 400;

  loading = signal(false);
  hasMore = true;
  totalPages: any;
  currentPage = 0;
  limitPage = 5;

  observer: any;
  @ViewChildren('theLastList', { read: ElementRef }) theLastList: QueryList<ElementRef>;
  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;

  private destroy$ = new Subject<void>();

  postLoading: string[] = ["hola", "que", "tal"];

  url: string;

  private platformId = inject(PLATFORM_ID);
  public bookmarkService = inject(BookmarkService);
  private meta = inject(Meta);
  private title = inject(Title);
  private document = inject(DOCUMENT);
  private spinnerService = inject(SpinnerService);
  private dialogService = inject(DialogService);
  private postService = inject(PostService);
  public router = inject(Router);
  private location = inject(Location);
  private subscriptionService = inject(SubscriptionService);
  public authService = inject(AuthService);
  public toolsService = inject(ToolsService);

  constructor() {

    this.title.setTitle('Bookmarks');

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.url = this.router.url;
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.findAll();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {

  }

  // find all 
  findAll() {

    if (!this.hasMore) return;
    this.loading.set(true);

    const data: any = {
      typeView: 'FREE'
    };

    this.bookmarkService.findAllUser(data, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {

          if (res && res.data.length > 0) {

            if (this.currentPage === 0) {
              this.bookmarkService.resetBookmarks();
              this.totalPages = res.total;
            }

            const currents = this.bookmarkService.bookmarks();
            const newItems = res.data.filter((item: Bookmark) => {
              return !currents.some(existing => existing._id === item._id);
            });
            const updatedItems = [...currents, ...newItems];
            this.bookmarkService.addBookmarks(updatedItems);
            this.hasMore = res.data.length <= this.limitPage;

            // Extraer solo los `Post`
            const postsArray = res.data.map((item: Bookmark) => item.Post);
            const currentsSwiping = this.postService.postsSwiping();
            const newSwipingItems = postsArray.filter((item: Post) => {
              return !currents.some(existing => existing._id === item._id);
            });
            const updatedSwipingItems = [...currentsSwiping, ...newSwipingItems];
            this.postService.addPostsSwiping(updatedSwipingItems);

          } else if (res && res.data.length === 0 && this.currentPage === 0) {
            this.bookmarkService.resetBookmarks();
          } else {
            this.hasMore = false;
          }
        },
        error: (err) => {
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
          console.log('Request completed');
        }
      });
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      if (this.hasMore && !this.loading()) {
        this.currentPage += this.limitPage;
        this.findAll();
      }
    }
  }

  onPost(item: Bookmark) {
    this.postService.resetPost();

    const user: User = {
      _id: this.authService.user()?._id,
    };

    // Crear un objeto plano sin referencias circulares
    const post: Post = {
      ...item.Post,
      Bookmark: { ...item, Post: undefined }, // Rompe la referencia circular
      isBookmarked: true,
      Subscription: item.Subscription,
      currentSubscriptionDate: item.currentSubscriptionDate,
      route: `admin/bookmarks`,
    };

    this.postService.addPost(post);

    this.dialogService.toggleModal('modalPost');
    this.router.navigate(['admin/bookmarks/posts', 'pu', post.slug]);

  }

  openVideo(item: Post) {
    this.postService.addPost(item);
    this.dialogService.toggleModal('postModal');

    if (this.url) {
      if (this.url == 'p') {
        console.log('es p');
        this.router.navigate(['/p', item.slug]);

      } else if (this.url != 'p') {
        console.log('distindo pu');
        this.router.navigate([this.url, 'p', item.slug]);
      }
    } else {
      console.log('null')
      this.router.navigate(['/p', item.slug]);
    }
  }

  // subscription

  verifiedPrivate(bookmark: Bookmark) {
    const post = bookmark.Post!;
    const currentSubscriptionDate = bookmark?.currentSubscriptionDate || 0;
    const expirationDate = bookmark?.Subscription?.expirationDate || 0;

    const daysDifference = this.postService.calculateDaysDifference(currentSubscriptionDate, expirationDate);
    let currentPrivate = false;

    if (post.typeView === 'FREE' || this.authService?.user()?._id === post?.User?._id) {
      currentPrivate = false;
    } else {
      if (Number(daysDifference) > 0) {
        currentPrivate = false;
      } else {
        currentPrivate = true;
      }
    }

    return currentPrivate;
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

  goBack(): void {
    this.location.back();
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


