import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, ComponentRef, computed, effect, ElementRef, HostListener, inject, Inject, OnInit, PLATFORM_ID, QueryList, signal, Signal, ViewChild, ViewChildren, ViewContainerRef, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { PostService } from '@services/post.service';
import { AuthService } from '@services/auth.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser, isPlatformServer, Location, NgOptimizedImage } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';;
import { SubscriptionService } from '@services/subscription.service';
import { SpinnerService } from '@services/spinner.service';
import { environment } from '@environments/environment';
import { CounterService } from '@services/counter.service';
import { TipService } from '@services/tip.service';
import { SugestionsComponent } from '@shared/sugestions/sugestions.component';
import { DialogService } from '@services/dialog.service';
import { CommentsPostComponent } from '@layout/post/pages/comments-post/comments-post.component';
import { UIStyles } from '@core/common/uistyles';
import { ReadMoreComponent } from '@library/read-more/read-more.component';
import { Post } from '@interfaces/post';
import { Subscription } from '@interfaces/subscription';
import { TipComponent } from '@shared/tip/tip.component';
import { ModalPostComponent } from '@layout/post/pages/modal-post/modal-post.component';
import { DropdownPostComponent } from '@layout/post/pages/dropdown-post/dropdown-post.component';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { SearchOuterComponent } from '@layout/search/search-outer/search-outer.component';
import { SeoService } from '@services/seo.service';
import { MetaTag } from '@interfaces/metaTags';
import { ToastService } from '@services/toast.service';
import { ToolsService } from '@services/tools.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import CreateAdComponent from '@layout/admin/create/create-ad/create-ad.component';
import { CalculateAgePipe } from '@pipes/calculate-age.pipe';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgeValidator } from '@core/common/custom-validators.ts';
import { CountryService } from '@services/country.service';
import { Country } from '@interfaces/country';
import { CountryStateService } from '@services/country-state.service';
import { CountryState } from '@interfaces/countryState';
import { CreditPurchaseComponent } from '@shared/credit-purchase/credit-purchase.component';
import { UserService } from '@services/user.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { ModalLoginAuthComponent } from '@layout/auth/pages/modal-login-auth/modal-login-auth.component';
import { StateCity } from '@interfaces/stateCity';
import { StateCityService } from '@services/state-city.service';
import { User, UserPermissions } from '@interfaces/user';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { TranslateService } from '@ngx-translate/core';

export interface Count {
  total: number,
  active: number,
  expired: number
}

@Component({
  selector: 'app-list-ads',
  imports: [
    NgOptimizedImage,
    CommonModule,
    RouterModule,
    CustomTranslatePipe,
    IconDirective,
    FormsModule,
    ReactiveFormsModule,
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
  templateUrl: './list-ads.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './list-ads.component.scss'
})
export default class ListAdsComponent {

  isBrowser: boolean;
  isServer: boolean;

  @ViewChildren('theLastList', { read: ElementRef }) theLastList: QueryList<ElementRef>;
  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;

  showButton = false;
  scrollHeight = 400;

  loading = signal(false);

  posts: Post[] = [];
  post: Post;

  tag: string | null;

  currentPage = 0;
  limitPage = 12;
  totalPages = 0;
  hasMore: boolean = true;

  count = signal<Count | null>(null);

  dataSearch: any;
  isFirstElement = true;
  isPost: boolean;

  subscription: Subscription | null;
  subscribersJoin: Subscription[] = [];

  private destroy$ = new Subject<void>();

  postLoading: string[] = ["hola", "que", "tal", "hola", "que", "tal", "hola", "que"];

  myFormSearch: FormGroup;
  search: string | null;

  permissions: UserPermissions | null = null;

  // country
  countries = signal<Country[] | null>(null);
  countryStates = signal<CountryState[] | null>(null);
  stateCyties = signal<StateCity[] | null>(null);

  //  component
  private createPostComponentRef: ComponentRef<CreateAdComponent> | null = null;
  private creditPurchaseComponentRef: ComponentRef<CreditPurchaseComponent> | null = null;
  private modalLoginAuthComponentRef: ComponentRef<ModalLoginAuthComponent> | null = null;

  public translateService = inject(TranslateService);
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
  private title = inject(Title);
  public countryService = inject(CountryService);
  private countryStateService = inject(CountryStateService);
  public userService = inject(UserService);
  public transactionCreditService = inject(TransactionCreditService);
  private stateCityService = inject(StateCityService);
  private location = inject(Location);
  private toolsService = inject(ToolsService);

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    effect(() => {
      this.permissions = this.userService.permissions();
    });

    this.activatedRoute.paramMap.subscribe((params) => {
      this.tag = params.get('tag');
      this.title.setTitle(this.tag!);
    });

  }

  ngOnInit(): void {
    this.createFormControls();
    //this.postService.resetPosts();
    this.findAllPosts();
    this.headPage();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {

  }

  createFormControls() {
    this.myFormSearch = new FormGroup({
      search: new FormControl('', [Validators.required]),
      status: new FormControl('ALL', [Validators.required]),
    });
  }

  // find
  findAllPosts() {
    if (!this.hasMore) return;

    this.loading.set(true);
    const data: any = {
      type: 'AD'
    };

    if (this.tag) {
      data.search = this.tag;
    }

    if (this.authService.user()) {
      data.User = this.authService.user()?._id;
    }

    data.typeView = 'FREE';

    if (this.myFormSearch?.value) {
      const { search, gender, minAge, maxAge, country, countryState, stateCity, status } = this.myFormSearch.value;

      if (search) {
        data.search = `${search}`;
      }

      if (status && status !== 'ALL') {
        data.status = status;
      }

      if (gender) {
        data.gender = `${gender}`;
      }

      if (minAge) {
        data.minAge = Number(minAge);
      }

      if (maxAge) {
        data.maxAge = Number(maxAge);
      }

      if (country) {
        data.Country = country;
      }

      if (countryState) {
        data.CountryState = countryState;
      }

      if (stateCity) {
        data.StateCity = stateCity;
      }
    }

    this.postService.findAllSearchPostsUser(data, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {

          if (res && res.data.length > 0) {

            if (this.currentPage === 0) {
              this.postService.resetPostAdsUser();
              this.postService.resetPostsSwiping();
              this.totalPages = res.total;
            }

            const currentPosts = this.postService.postAdsUser();
            const newPosts = res.data.filter((newPost: Post) => {
              return !currentPosts.some(existingPost => existingPost._id === newPost._id);
            });
            const updatedPosts = [...currentPosts, ...newPosts];
            this.postService.addPostAdsUser(updatedPosts);
            this.posts = this.postService.postAdsUser();

            // Extraer solo los `Post`
            const currentsSwiping = this.postService.postsSwiping();
            const newSwipingItems = res.data.filter((newPost: Post) => {
              return !currentPosts.some(existingPost => existingPost._id === newPost._id);
            });
            const updatedSwipingItems = [...currentsSwiping, ...newSwipingItems];
            this.postService.addPostsSwiping(updatedSwipingItems);


            this.hasMore = res.data.length <= this.limitPage;
          } else if (res && res.data.length === 0 && this.currentPage === 0) {
            this.postService.resetPostAdsUser();
            this.postService.resetPostsSwiping();
          }
          else {
            this.hasMore = false;
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
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
        this.currentPage = this.currentPage + this.limitPage;
        this.findAllPosts();
      }
    }
  }

  // countries
  async findAllCountries() {
    const countries = await this.countryService.findAllDatting();
    this.countries.set(countries);
    this.defaultCountry();
  }

  async onCountryState(e: any) {
    this.findCountryState(e.target.value);
  }

  defaultCountry() {
    const countryDefault = this.authService.user()?.CountryAd || this.authService.user()?.Country;
    const idCountry = countryDefault?._id || environment.countryDefault;
    this.myFormSearch.patchValue({
      country: idCountry
    });
    this.findCountryState(idCountry);
  }

  async findCountryState(idCountry: string) {
    const data = {
      Country: idCountry
    };
    const countryStates = await this.countryStateService.findAllCountry(data);
    this.countryStates.set(countryStates);
    this.myFormSearch.patchValue({
      countryState: this.countryStates()!.length > 0 ? this.countryStates()![0]._id : null
    });
    this.defaultCountryState();
  }

  defaultCountryState() {
    const idCountryState = this.countryStates()![0]._id!;
    this.findStateCity(idCountryState);
  }

  async onStateCity(e: any) {
    this.findStateCity(e.target.value);
  }

  async findStateCity(idCountryState: string) {
    const countryState = this.countryStates()?.find(item => item._id == idCountryState);
    const IdCountryState = countryState?._id!;
    const stateCyties = await this.stateCityService.findAllCountryState(IdCountryState);
    this.stateCyties.set(stateCyties);

    this.myFormSearch.patchValue({
      stateCity: this.stateCyties()!.length > 0 ? this.stateCyties()![0]._id : null
    });

  }

  // search 
  onSearchToogle(): void {
    this.dialogService.toggleModal('searchPostAd');

    if (!this.countries()) {
      this.findAllCountries();
    }

  }

  onStatusSearch(e: any): void {
    this.onSubmitSearch();
  }

  onSubmitSearch(): void {

    this.dialogService.closeModal();
    this.loading.set(true);

    this.hasMore = true;
    this.totalPages = 0;
    this.currentPage = 0;

    this.postService.resetPostAds();

    this.findAllPosts();
  }

  // seo
  headPage() {
    const data: MetaTag = {
      title: `Yuvinka | Dating, Make Friends & Meet New People `,
      description: "With 55 billion matches to date, Yuvinka® is the world’s most popular dating app, making it the place to meet new people.",
      path: ``,
      image: `${environment.urlCurrent}/public/logo/dating.jpg`
    };

    const title = `${data.title}`;
    this.title.setTitle(title!);

    this.seoService.updateMetaTags(data);
  }

  verifiedPrivate(item: Post) {
    if (!item) {
      return false;
    }

    const post = item;
    const currentSubscriptionDate = item?.currentSubscriptionDate || 0;
    const expirationDate = item?.Subscription?.expirationDate || 0;

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

  // create post
  async onCreatePost() {

    const user = this.authService.user()!;
    if (user.status === 'SUSPENDED') {
      this.toastService.start({ type: 'error', message: 'accountSuspended' });
      return;
    }

    const userCredit = this.userService.userCurrent()?.UserCredit?.current || 0;
    const gender = this.authService.user()?.gender || 'MAN';

    // suspendido por el momento hasta que llenen anuncios
    // if (gender === 'MAN' && Number(userCredit) <= Number(10)) {
    //   this.onCreditPurchase();
    //   return;
    // }

    this.onCreatePostModal();
  }

  //post
  onPost(post: Post) {
    this.postService.resetPost();
    const data: Post = {
      ...post,
      route: `admin/ads`,
    };
    this.postService.addPost(data);
    this.router.navigate(['ads', 'pu', post.slug]);

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
    if (this.verifiedPrivate(item)) {
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

  // scroll
  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  // inner
  innerText(text: any) {
    return UIStyles.innerText(text);
  }

  // button action
  openTelegram(telegramUsername: string): void {

    if (!this.authService.user()) {
      this.onLoginModal();
      return;
    }

    const telegramUrl = `https://t.me/${telegramUsername}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  }

  openWhatsApp(phonePrefix: string, whatsappNumber: string, message: string): void {

    if (!this.authService.user()) {
      this.onLoginModal();
      return;
    }

    const whatsappUrl = `https://wa.me/${phonePrefix}${whatsappNumber}/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  // text
  textMessage(item: Post) {
    return `Hello, I just saw your page on ${environment.domain}, `
      + UIStyles.cropText(item.title!, 25) + '(...) '
      + `https://${environment.domain}/pu/` + item.slug;
  }

  onLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  //modal external
  onCreatePostModal() {

    const user = this.authService.user()!;
    if (user.status === 'SUSPENDED') {
      this.toastService.start({ type: 'error', message: 'accountSuspended' });
      return;
    }

    // 1. Reinicia el estado del post (opcional, según tu lógica)
    this.postService.resetPost();

    // 2. Limpia cualquier instancia previa del componente hijo
    this.clearCreatePostComponent();

    // 3. Crea dinámicamente el componente hijo
    const componentRef = this.viewContainerRef.createComponent(CreateAdComponent);

    // 4. Guarda la referencia del componente hijo para destruirlo más tarde
    this.createPostComponentRef = componentRef;

    // 5. Escucha el evento closeModal del componente hijo
    componentRef.instance.closeModal.subscribe(() => {
      console.log('The modal is closed from the child');
      this.clearCreatePostComponent(); // Destruye el componente hijo
      this.dialogService.closeModal(); // Cierra el modal visualmente
    });

    // 6. Abre el modal (opcional, según tu lógica)
    this.dialogService.toggleModal('createPostAd');
  }

  private clearCreatePostComponent() {
    if (this.createPostComponentRef) {
      this.createPostComponentRef.destroy();
      this.createPostComponentRef = null;
    }
  }

  onCreditPurchase() {
    this.clearCreditPurchaseComponent();
    const componentRef = this.viewContainerRef.createComponent(CreditPurchaseComponent);
    this.creditPurchaseComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearCreditPurchaseComponent(); // Destruye el componente hijo
      this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    this.dialogService.toggleModal('creditPurchase');
  }

  private clearCreditPurchaseComponent() {
    if (this.creditPurchaseComponentRef) {
      this.creditPurchaseComponentRef.destroy();
      this.creditPurchaseComponentRef = null;
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

  // close
  onCloseModal() {
    this.dialogService.closeModal();
  }

  // user image
  getProfileImageUrl(user: User): string {

    const userProfile = user!;
    if (!userProfile || !userProfile.Profile || userProfile.Profile.length === 0) {
      return '';
    }

    const profile = userProfile.Profile[0];
    if (profile.cloudflare && profile.cloudflare.result && profile.cloudflare.result.variants && profile.cloudflare.result.variants.length > 0) {
      return profile.cloudflare.result.variants[0];
    }
    return profile.url || '';
  }

  // return 
  goBack(): void {
    this.location.back();
  }

  cardModalClass() {
    return UIStyles.cardModalClass();
  }

  getFirstLetter(name: string): string {
    return this.toolsService.getFirstLetter(name);
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

  // button class
  buttonClass() {
    return UIStyles.buttonClass();
  }
}

