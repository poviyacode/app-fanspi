import { Component, CSP_NONCE, inject, PLATFORM_ID, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentOrderService } from '@services/payment-order.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { single, Subject, Subscription, takeUntil, timer } from 'rxjs';
import { SpinnerService } from '@services/spinner.service';
import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconDirective } from '@directive/coin-svg.directive';
import { StatusPaymentOrder } from '@interfaces/paymentOrder';

@Component({
  selector: 'app-notification-pay',
  imports: [
    CustomTranslatePipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IconDirective
  ],
  templateUrl: './notification-pay.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './notification-pay.component.scss'
})
export default class NotificationPayComponent {

  isBrowser: boolean;
  isServer: boolean;
  loading = signal(false);

  codeCollection: any;
  paymentOrder: any;

  private activatedRoute = inject(ActivatedRoute);
  public router = inject(Router);
  public paymentOrderService = inject(PaymentOrderService);
  private spinnerService = inject(SpinnerService);
  private platformId = inject(PLATFORM_ID);

  private destroy$ = new Subject<void>();

  constructor(
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.codeCollection = this.activatedRoute.snapshot.paramMap.get('code_collection');
  }

  ngOnInit(): void {
    this.findOne();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  findOne() {
    if (this.codeCollection) {
      this.spinnerService.start();
      this.paymentOrderService.findOneCodeCollectionPay(this.codeCollection)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {
              this.paymentOrderService.addPaymentOrder(res);
              this.spinnerService.close();

              if (res.status === 'PETITION') {
                this.router.navigate(['/pay/checkout', this.codeCollection]);
              } else if (res.status === 'DECLINE' || res.status === 'ERROR') {
                timer(5000)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(() => {
                    this.onPayment();
                  });
              } else if (res.status === StatusPaymentOrder.PAID) {
                timer(5000)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(() => {
                    this.onCancelTransaction();
                  });
              }
            }
          },
          error: (err) => {
            this.loading.set(true);
            this.spinnerService.close();
          },
          complete: () => {
            this.loading.set(true);
            console.log('Request completed');
          }
        });
    }
  }

  onReturnPaymentTransaction(): void {
    let url = '';
    url = this.paymentOrderService.paymentOrder()?.gatewayDetails.urlReturn;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
  }

  onCancelTransaction(): void {
    let url = '';
    url = this.paymentOrderService.paymentOrder()?.gatewayDetails.urlReturn;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
  }

  onPayment(): void {
    const route = `pay/checkout`;
    this.router.navigate([`${route}`, this.codeCollection]);
  }
}
