import { trigger, transition, style, animate, query, stagger, keyframes, state } from '@angular/animations';
import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ApplicationRef, Component, ComponentRef, effect, HostListener, inject, Inject, OnInit, PLATFORM_ID, signal, ViewChild, ViewContainerRef, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '@environments/environment';
import { User, UserPermissions } from '@interfaces/user';
import { Post } from '@interfaces/post';
import { UserService } from '@services/user.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { SearchService } from '@services/search.service';
import { Subject, takeUntil, timer } from 'rxjs';
import { DialogService } from '@services/dialog.service';
import { TipService } from '@services/tip.service';
import { ToastService } from '@services/toast.service';
import { SpinnerService } from '@services/spinner.service';
import { TipComponent } from '@shared/tip/tip.component';
import { AuthService } from '@services/auth.service';
import { ChatService } from '@services/chat.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgeValidator } from '@core/common/custom-validators.ts';
import { CountryService } from '@services/country.service';
import { Country } from '@interfaces/country';
import { UIStyles } from '@core/common/uistyles';
import { SocketService } from '@services/socket.service';
import { CreditPurchaseComponent } from '@shared/credit-purchase/credit-purchase.component';
import { ModalLoginAuthComponent } from '@layout/auth/pages/modal-login-auth/modal-login-auth.component';
import { MessageService } from '@services/message.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { MetaTag } from '@interfaces/metaTags';
import { SeoService } from '@services/seo.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { Title } from '@angular/platform-browser';
import { v4 as uuidv4 } from 'uuid';
import { Chat } from '@interfaces/chat';
import { ToolsService } from '@services/tools.service';
import { InteractionService } from '@services/interaction.service';
import ProfileCardComponent from '@shared/profile-card/profile-card.component';
@Component({
  selector: 'app-users-agency',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    IconDirective,
    ProfileCardComponent
  ],
  templateUrl: './users-agency.component.html',
  styleUrl: './users-agency.component.scss',
})
export default class UsersAgencyComponent {
  isBrowser: boolean;
  isServer: boolean;
  urlCurrent = 'users';

  totalPages: number = 0;
  currentPage = 0;
  limitPage = 25;
  hasMore: boolean = true;
  imageLoaded = signal(false);

  shimmerState: string = 'idle';
  rotateState: string = 'normal';
  isLiveActive: boolean = true;

  isLoading = signal(false);
  posts: Post[] = [];
  countries = signal<Country[] | null>(null);

  permissions: UserPermissions | null = null;

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();

  // Lista inicial de creadoras gestionadas (vacía o con algunas por defecto)
  public managedCreators: any[] = [
    { _id: '64a1b2c3d4e5f67890123457', alias: 'Nayara', username: 'nayara', online: false },
  ];

  myForm: FormGroup;
  search: string | null;

  public className = UIStyles;

  public router = inject(Router);
  private activeRoute = inject(ActivatedRoute);
  public userService = inject(UserService);
  private searchService = inject(SearchService);
  public dialogService = inject(DialogService);
  private tipService = inject(TipService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  public authService = inject(AuthService);
  private chatService = inject(ChatService);
  public countryService = inject(CountryService);
  private platformId = inject(PLATFORM_ID);
  private socketService = inject(SocketService);
  private applicationRef = inject(ApplicationRef);
  public messageService = inject(MessageService);
  private seoService = inject(SeoService);
  private transactionCreditService = inject(TransactionCreditService);
  private title = inject(Title);
  private toolsService = inject(ToolsService);
  private interactionService = inject(InteractionService);
  private ngZone = inject(NgZone);

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    effect(() => {
      this.permissions = this.userService.permissions();
    });

    if (this.isBrowser) {
      this.searchService.sharedData$.subscribe((search) => {
        if (search) {
          this.search = search === 'all' ? null : search;
          this.currentPage = 0;
          this.hasMore = true;
          this.findSearch();
        }
      });
    }
  }

  ngOnInit(): void {

    if (this.isBrowser) {
      this.createFormControls();
      this.findSearch();
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const isRefresh = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';

      if (isRefresh) {
        timer(3000)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.userOnlineSocket();
          });
      } else {
        this.userOnlineSocket();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.destroy$.next();
      this.destroy$.complete();

      this.detachSocketEvents();
      // resert
      //this.userService.resetUsersProfile();
      this.dialogService.closeModal();
      this.countries.set(null);
    }
  }

  createFormControls() {
    this.myForm = new FormGroup({
      search: new FormControl('', [Validators.required]),
      gender: new FormControl('', [Validators.required]),
      minAge: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(2), AgeValidator]),
      maxAge: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(2), AgeValidator]),
      country: new FormControl('', [Validators.required]),
    });
  }

  // find
  findSearch() {

    if (!this.hasMore) return;
    this.isLoading.set(true);

    let data: any = {};

    if (this.myForm?.value) {
      const { search, minAge, maxAge, country } = this.myForm.value;

      const gender = 'WOMAN';

      if (search) {
        data.search = `${search}`;
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

    }

    this.userService.userProfiles(data, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {

          if (res && res.data.length > 0) {
            if (this.currentPage === 0) {
              this.totalPages = Number(res.total);
            }

            this.userService.addUsersProfile(res.data);

            this.hasMore = res.data.length <= this.limitPage;

          } else {
            this.hasMore = false;
          }

        },
        error: (err) => {
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
          console.log('Request completed');
        }
      });
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      if (this.hasMore && !this.isLoading()) {
        this.currentPage = this.currentPage + this.limitPage;
        this.findSearch();
      }
    }
  }

  async findAllCountries() {
    const countries = await this.countryService.findAllDatting();
    this.countries.set(countries);
  }

  // search 
  onSearchToogle(): void {
    this.dialogService.toggleModal('searchProfiles');
    //this.myForm.reset();
    this.shimmerState = 'active';
    setTimeout(() => {
      this.shimmerState = 'idle';
    }, 700);

    if (!this.countries()) {
      this.findAllCountries();
    }
  }


  onHoverRotate(state: string) {
    this.rotateState = state;
  }

  onSearch(): void {

    this.dialogService.closeModal();
    this.isLoading.set(true);

    this.hasMore = true;
    this.totalPages = 0;
    this.currentPage = 0;
    this.userService.resetUsersProfile();
    this.findSearch();

  }

  // close
  onCloseModal() {
    this.dialogService.closeModal();
  }

  onLive(): void {
    this.router.navigate(['/lives']);
  }

  // socket 
  userOnlineSocket() {

    if (!this.socketService.socket) {
      this.socketService.connect();
    }
    return;
    // 2. Pedimos los usuarios online de la RAM una vez configuradas las escuchas
    // SYNC PERIÓDICO CONTROLADO (Polling cada 45 segundos fuera de Zone.js)
    this.ngZone.runOutsideAngular(() => {
      timer(0, 45000) // Se ejecuta al inicio y luego cada 45 segundos
        .pipe(takeUntil(this.destroy$))
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

  //
  public toggleLeysiOnlineStatus(): void {
    const leysiId = '6487ef144d68a13e411cf349';

    const leysi = this.managedCreators.find(c => c._id === leysiId);
    const nextState = leysi ? !leysi.online : true;

    if (this.socketService.socket && this.socketService.socket.connected) {
      // Emitimos el evento hacia el backend
      this.socketService.socket.emit('admin_force_user_online', {
        userId: leysiId,
        online: nextState
      });

      // Actualizar localmente de inmediato el estado en la interfaz del admin
      if (leysi) {
        leysi.online = nextState;
      } else {
        this.managedCreators.push({
          _id: leysiId,
          alias: 'Leysi',
          username: 'leysi',
          online: nextState
        });
      }
    }
  }

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
