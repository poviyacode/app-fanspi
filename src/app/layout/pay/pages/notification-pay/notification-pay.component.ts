import { Component, CSP_NONCE, inject, PLATFORM_ID, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentOrderService } from '@services/payment-order.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { single, Subject, Subscription, takeUntil, timer } from 'rxjs';
import { SpinnerService } from '@services/spinner.service';
import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconDirective } from '@directive/coin-svg.directive';
import { Tools } from '@core/common/tools';

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

              } else if (res.status === 'PAID') {
                timer(5000)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(() => {
                    this.onCancelTransaction();
                  });
              } else {
                timer(5000)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(() => {
                    this.onPayment();
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
    const dataUpdate = {
      updateStatus: 'CHANGE_CODE',
    };
    const id = this.paymentOrderService.paymentOrder()?._id!;
    this.spinnerService.start();

    this.paymentOrderService.update(id, dataUpdate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.router.navigate([`${route}`, res.codeCollection]);
          }
        },
        error: (err) => {
          this.loading.set(true);
          this.spinnerService.close();
        },
        complete: () => {
          this.loading.set(true);
          this.spinnerService.close();
          console.log('Request completed');
        }
      });
  }

  // Getter para obtener el último intento
  get lastAttempt(): any | undefined {
    return this.paymentOrderService.paymentOrder()?.attempts?.at(-1);
  }

  // Getter directo para el estatus de la última transacción
  get lastAttemptStatus(): string {
    return this.lastAttempt?.status ?? 'NO_ATTEMPTS';
  }

  getLastInstallmentError(): any | null {
    const order = this.paymentOrderService.paymentOrder();
    if (order?.installments && order.installments.length > 0) {
      const last = order.installments[order.installments.length - 1];
      if (last?.status === 'DECLINE') {
        return last;
      }
    }
    return null;
  }

  // Extrae de manera segura el mensaje de error sin importar de dónde venga
  get currentOrder() {
    return this.paymentOrderService.paymentOrderPay();
  }
  getErrorMessage(): string | null {
    return this.paymentOrderService.getErrorMessage(this.currentOrder);
  }

  // COMMON CLASS
  cardClass() {
    return Tools.cardClass();
  }

  modalClass() {
    return Tools.modalClass();
  }

  buttonClass() {
    return Tools.buttonClass();
  }

  buttonSecondaryClass() {
    return Tools.buttonSecondaryClass();
  }

  buttonPrimaryClass() {
    return Tools.buttonPrimaryClass();
  }
}
