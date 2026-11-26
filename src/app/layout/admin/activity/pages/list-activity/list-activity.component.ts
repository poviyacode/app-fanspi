import { CommonModule, isPlatformBrowser, isPlatformServer, Location } from '@angular/common';
import { AfterViewInit, Component, ComponentRef, ElementRef, EventEmitter, HostListener, inject, Inject, Input, OnInit, Output, PLATFORM_ID, QueryList, signal, ViewChild, ViewChildren, ViewContainerRef, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UIStyles } from '@core/common/uistyles';
import { Post } from '@interfaces/post';
import { TransactionCredit } from '@interfaces/transactionCredit';
import { SpinnerService } from '@services/spinner.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { DialogService } from '@services/dialog.service';
import { PostService } from '@services/post.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { Subject, takeUntil } from 'rxjs';
import WithdrawalMoneyActivityComponent from '../withdrawal-money-activity/withdrawal-money-activity.component';
import { DomSanitizer, SafeResourceUrl, Title } from '@angular/platform-browser';
import { AuthService } from '@services/auth.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import { UserService } from '@services/user.service';
import { SubscriptionService } from '@services/subscription.service';
import CodeVerificationComponent from '@shared/code-verification/code-verification.component';
import { TokenService } from '@services/token.service';
import { ToastService } from '@services/toast.service';
import { ToolsService } from '@services/tools.service';
import { PostMediaDetails } from '@interfaces/postMedia';
import { PostMediaService } from '@services/post-media.service';
import ViewDetailActivityComponent from '../view-detail-activity/view-detail-activity.component';
import { PaymentOrderService } from '@services/payment-order.service';
import SearchActivityComponent from '../search-activity/search-activity.component';

@Component({
  selector: 'app-list-activity',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    FormsModule,
    IconDirective,
    TruncatePipe,
    DateAgoPipe,
  ],
  templateUrl: './list-activity.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './list-activity.component.scss'
})
export default class ListActivityComponent {

  isBrowser: boolean;
  isServer: boolean;
  public className = UIStyles;

  @ViewChildren('theLastList', { read: ElementRef }) theLastList: QueryList<ElementRef>;
  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private destroy$ = new Subject<void>();

  //  component
  private codeVerificationComponentRef: ComponentRef<CodeVerificationComponent> | null = null;

  showButton = false;
  scrollHeight = 500;
  showScrollButton = false;
  isProfitVisible: boolean = true;
  hasMore = true;
  isLoading = signal(false);
  totalPages = 0;
  currentPage = 0;
  limitPage = 20;

  search: any;
  status: string;
  type: string;
  order: any;

  bodyText: string;
  postLoading: string[] = ["hola", "que", "tal"];
  url: string;

  profit: number = 0;

  public router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT)
  private spinnerService = inject(SpinnerService);
  public transactionCreditService = inject(TransactionCreditService);
  private activatedRoute = inject(ActivatedRoute);
  public dialogService = inject(DialogService);
  public authService = inject(AuthService);
  public title = inject(Title);
  public userService = inject(UserService);
  private subscriptionService = inject(SubscriptionService);
  private tokenService = inject(TokenService);
  private toastService = inject(ToastService);
  private toolsService = inject(ToolsService);
  private postMediaService = inject(PostMediaService);
  private paymentOrderService = inject(PaymentOrderService);

  constructor() {

    this.title.setTitle('Activity');

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    this.search = this.activatedRoute.snapshot.queryParamMap.get('search');

    this.activatedRoute.paramMap.subscribe((params) => {
      this.url = params.get('status') || 'active';
      this.hasMore = true;
      this.currentPage = 0;

    });

    if (this.isBrowser) {
      this.transactionCreditService.resetBalanceTransactionCredit();
      this.transactionCreditService.resetTransactionCredits();
      this.findAllUser();
    }

  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {

  }

  findAllUser() {

    if (!this.hasMore) return;
    this.isLoading.set(true);

    const data: any = {};

    if (this.status) {
      data.status = this.status;
    }

    if (this.type) {
      data.type = this.type;
    }

    if (this.search) {
      data.search = this.search;
    }

    if (this.order) {
      data.order = this.order;
    }

    this.transactionCreditService.activityTransactionUser(data, this.limitPage, this.currentPage).subscribe({
      next: (res) => {
        if (res && res.data.length > 0) {
          const { accountBalance, UserCredit, CreditCalculator } = res;

          if (this.currentPage === 0) {
            if (accountBalance) this.transactionCreditService.addBalanceTransactionCredit(accountBalance);
            if (UserCredit) this.userService.updateUserCurrent({ UserCredit: UserCredit });
            if (CreditCalculator) this.transactionCreditService.addCreditCalculator(CreditCalculator);
            this.totalPages = Number(res.total);
          }

          const currents = this.transactionCreditService.transactionCredits();
          const news = res.data.filter((newItem: TransactionCredit) => {
            return !currents.some(existingPost => existingPost._id === newItem._id);
          });
          const updateds = [...currents, ...news];
          this.transactionCreditService.addTransactionCredits(updateds);

          this.hasMore = this.currentPage <= this.totalPages;

        } else {
          this.hasMore = false;
        }
      },
      error: (err) => {
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      if (this.hasMore && !this.isLoading()) {
        this.currentPage = this.currentPage + this.limitPage;
        this.findAllUser();
      }
    }
  }

  // scroll
  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTo({
        top: this.scrollContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    } catch (err) {
      console.error(err);
    }
  }

  // search
  onResetSearch() {
    this.status = '';
    this.type = '';
    this.search = null;
    this.order = null;

    // Limpiamos los queryParams de la URL
    this.router.navigate(['admin/activity'], { queryParams: {} });

    this.limitPage = 20;
    this.currentPage = 0;
    this.hasMore = true;
    this.transactionCreditService.resetTransactionCredits();
    this.findAllUser();
  }

  // withdrawal
  onWithdrawalMoney(): void {

    if (!this.authService.user()?.emailVerified) {
      this.onConfirmEmail();
      return;
    }

    if (this.transactionCreditService.balanceTransactionCredit()?.availableMoney! > 0) {

      this.viewContainerRef.clear();
      const componentRef = this.viewContainerRef.createComponent(WithdrawalMoneyActivityComponent);
      componentRef.instance.cancelWithdrawal.subscribe(() => {
        this.viewContainerRef.clear();
      });

      componentRef.instance.sendWithdrawal.subscribe((res) => {
        this.onSendWithdrawal(res!);
      });
    }

  }
  // withdrawal
  onSendWithdrawal(data?: { amount: string, paymentMethod: string }) {

    this.spinnerService.start();

    this.transactionCreditService.withdrawalRequest(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            const currents = this.transactionCreditService.transactionCredits();
            const updateds = [res.TransactionCredit, ...currents];
            this.transactionCreditService.addTransactionCredits(updateds);

            this.transactionCreditService.addBalanceTransactionCredit(res.accountBalance);
            this.spinnerService.close();
            this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
          }
        },
        error: (err) => {
          if (err.error.message === 'ExistPendding') {
            this.toastService.start({ type: 'error', message: 'requestInProcess' });
          } else {
            this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
          }

          this.spinnerService.close();
        },
        complete: () => {
          console.log('Request completed');
        }
      });
  }

  onSearch() {
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(SearchActivityComponent);
    componentRef.instance.close.subscribe(() => {
      this.viewContainerRef.clear();
    });

    componentRef.instance.searchSubmit.subscribe((filters) => {
      this.status = filters.status;
      this.type = filters.type;
      this.search = filters.q;
      this.order = filters.order;

      this.router.navigate(['admin/activity'], {
        queryParams: {
          search: filters.q,
          status: filters.status,
          type: filters.type,
          order: filters.order
        }
      });

      this.limitPage = 20;
      this.currentPage = 0;
      this.hasMore = true;
      this.transactionCreditService.resetTransactionCredits();
      this.findAllUser();
      this.viewContainerRef.clear();
    });
  }

  viewDetail(item: TransactionCredit) {
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(ViewDetailActivityComponent);
    componentRef.instance.item = item;
    componentRef.instance.close.subscribe(() => {
      this.viewContainerRef.clear();
    });

    componentRef.instance.cancelOrderP2p.subscribe((transaction) => {
      this.cancelP2pUserOrder(transaction);
      this.viewContainerRef.clear();
    });
  }

  // p2P
  cancelP2pUserOrder(item: TransactionCredit) {
    this.spinnerService.start();
    const id = item.PaymentOrder?._id!;

    this.paymentOrderService.cancelP2pUserOrder(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const { PaymentOrder } = res;
          if (PaymentOrder) this.transactionCreditService.updateTransactionCredits(id, {
            [PaymentOrder.status!]: PaymentOrder.status,
            status: PaymentOrder.status
          });

          if (PaymentOrder._id) this.router.navigate(['/admin/activity']);
          this.toastService.start({ type: 'success', message: 'paymentOrderCancelled' });
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
        },
        complete: () => {
          this.spinnerService.close();
        }
      });
  }

  logout() {
    this.dialogService.closeModal();
    this.subscriptionService.resetSubscribersUserJoin();
    this.authService.logout();
  }

  // verify email
  async onConfirmEmail() {

    this.spinnerService.start();
    const data: any = {
      category: "VERIFY_EMAIL",
      type: "EMAIL",
      email: this.authService.user()?.email
    }

    const res = await this.tokenService.create(data);
    if (res && res.token) {
      this.tokenService.addToken(res.token);
      this.onCodeVedrificationModal();
    } else {
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
    }
    this.spinnerService.close();
  }

  //modal external
  onCodeVedrificationModal() {

    this.clearCodeVerificationComponent();

    const componentRef = this.viewContainerRef.createComponent(CodeVerificationComponent);

    this.codeVerificationComponentRef = componentRef;

    componentRef.instance.closeModal.subscribe(() => {
      this.clearCodeVerificationComponent();
      this.dialogService.closeModal();
    });

    this.dialogService.toggleModal('codeVerification');
  }

  private clearCodeVerificationComponent() {
    if (this.codeVerificationComponentRef) {
      this.codeVerificationComponentRef.destroy();
      this.codeVerificationComponentRef = null;
    }
  }

  // credit purchase
  openCreditPurchase(): void {
    this.dialogService.toggleModal('creditPurchase');
  }

  // scroll
  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  // toogle published
  togglePublished(transactionCredit: Post) {

    if (transactionCredit.publishedCount! > 0) {
      const data = {
        published: !transactionCredit.published
      }
      transactionCredit.published = !transactionCredit.published;
    }
  }

  toggleProfitVisibility() {
    this.isProfitVisible = !this.isProfitVisible;
  }

  // select row index table
  selectedRowIndex: number | null = null;

  onRowClick(index: number): void {
    if (this.selectedRowIndex === index) {
      //this.selectedRowIndex = null; // Deselect if clicked again
    } else {
      this.selectedRowIndex = index;
    }
  }

  getFirstLetter(name: string): string { return this.toolsService.getFirstLetter(name); }
  getMediaDetails(item: any): PostMediaDetails | null { return this.postMediaService.getBackgroundImageUrl(item); }

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
}
