import { CommonModule, isPlatformBrowser, isPlatformServer, Location } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, Inject, Input, OnInit, Output, PLATFORM_ID, QueryList, ViewChildren, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Post } from '@interfaces/post';
import { TransactionCredit } from '@interfaces/transactionCredit';
import { SpinnerService } from '@services/spinner.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { DialogService } from '@services/dialog.service';
import { PostService } from '@services/post.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { Subject } from 'rxjs';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { DateAgoPipe } from '@pipes/date-ago.pipe';

@Component({
  selector: 'app-list-incomes',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    TruncatePipe,
    DateAgoPipe
  ],
  templateUrl: './list-incomes.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./list-incomes.component.scss']
})
export default class ListIncomesComponent {

  @ViewChildren('theLastList', { read: ElementRef }) theLastList: QueryList<ElementRef>;
  private destroy$ = new Subject<void>();

  showButton = false;
  scrollHeight = 500;

  loading = false;
  hasMore: boolean = true;
  totalPages: any;
  currentPage = 0;
  limitPage = 10;
  search: any;

  isBrowser: boolean;
  data: any;
  adCount: any;
  myForm: FormGroup;

  bodyText: string;
  postLoading: string[] = ["hola", "que", "tal"];
  url: string;

  profit: number = 0;

  private postService = inject(PostService);
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT)
  private spinnerService = inject(SpinnerService);
  public transactionCreditService = inject(TransactionCreditService);
  private activatedRoute = inject(ActivatedRoute);

  constructor(

  ) {

    this.activatedRoute.paramMap.subscribe((params) => {
      this.url = params.get('status') || 'active';
      this.loading = false;
      this.hasMore = true;
      this.currentPage = 0;
      this.transactionCreditService.resetTransactionCredits();
      this.findAllUser();
    });

    this.myForm = this.fb.group({
      search: [null],
    });
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
    this.data = {
      status: this.url == 'active' ? 'ACCEPT' : 'DECLINE'
    };

    this.loading = true;
    this.transactionCreditService.incomeTransaction(this.data, this.limitPage, this.currentPage).subscribe({
      next: (res) => {

        if (res && res.data.length > 0) {

          if (this.currentPage === 0) {
            this.profit = res.sum;
            this.totalPages = res.total;
          }

          const currents = this.transactionCreditService.transactionCredits();
          const news = res.data.filter((newPost: Post) => {
            return !currents.some(existingPost => existingPost._id === newPost._id);
          });
          const updateds = [...currents, ...news];
          this.transactionCreditService.addTransactionCredits(updateds);

          this.hasMore = this.currentPage <= this.totalPages;

        } else {
          this.hasMore = false;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading incomes:', err);
        this.loading = false;
      }
    });
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      if (this.hasMore && !this.loading) {
        this.currentPage = this.currentPage + this.limitPage;
        this.findAllUser();
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


  onSubmit(): void {
    this.totalPages = 0;
    this.currentPage = 0;
    this.transactionCreditService.resetTransactionCredits();
    //this.findAllPostUser();

  }

  onEdit(id: string): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate(['/panel/create-ad/details/' + id]);
  }

  onManage(id: string): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate(['/panel/create-ad/manage/' + id]);
  }

  onPromote(id: string): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate(['/panel/create-ad/promote/' + id]);
  }

  onPhotos(id: string): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate(['/panel/create-ad/media/' + id]);
  }

  togglePublished(transactionCredit: Post) {

    if (transactionCredit.publishedCount! > 0) {
      const data = {
        published: !transactionCredit.published
      }
      transactionCredit.published = !transactionCredit.published;
    }
  }

  prinImages(images: any) {
    if (images[0].type == 'video') {
      return images[0]['urlSnapshot'];
    } else {
      return images[0]['url'];
    }

  };

  //-------------- select row index table
  selectedRowIndex: number | null = null;

  onRowClick(index: number): void {
    if (this.selectedRowIndex === index) {
      //this.selectedRowIndex = null; // Deselect if clicked again
    } else {
      this.selectedRowIndex = index;
    }
  }

}
