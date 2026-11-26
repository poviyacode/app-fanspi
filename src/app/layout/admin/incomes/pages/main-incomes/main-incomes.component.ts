import { isPlatformBrowser, isPlatformServer, Location } from '@angular/common';
import { Component, inject, Inject, OnInit, PLATFORM_ID, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { TransactionCreditService } from '@services/transaction-credit.service';

@Component({
  selector: 'app-main-incomes',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    CustomTranslatePipe
  ],
  templateUrl: './main-incomes.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./main-incomes.component.scss']
})
export default class MainIncomesComponent {

  isBrowser: boolean;
  isServer: boolean;
  count: any;
  search: any;

  private transactionCreditService = inject(TransactionCreditService);
  private platformId = inject(PLATFORM_ID);
  private activeRoute = inject(ActivatedRoute);
  private document = inject(DOCUMENT);
  private location = inject(Location);
  public router = inject(Router);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    this.search = this.activeRoute.snapshot.queryParamMap.get('search');
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.findAllCount();
    }
    this.onScrollTop();
  }

  findAllCount() {
    const data = {
      //q: this.myForm.value.q,
      //status: this.openTab == 1 ? 'ACTIVE' : 'INACTIVE'
    };
    this.transactionCreditService.incomeTransactionCounter(data).subscribe(res => {
      this.count = res;
    });
  }

  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  goBack(): void {
    this.location.back();
  }
}
