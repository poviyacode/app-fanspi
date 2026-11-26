import { Component, effect, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ChatService } from '@services/chat.service';
import { PaymentOrderService } from '@services/payment-order.service';
import { ToastService } from '@services/toast.service';
import { SpinnerService } from '@services/spinner.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { UIStyles } from '@core/common/uistyles';
import { Subject, takeUntil } from 'rxjs';
import { PaymentOrder } from '@interfaces/paymentOrder';
import { TransactionCredit } from '@interfaces/transactionCredit';
import { DateAgoPipe } from '@pipes/date-ago.pipe';

@Component({
  selector: 'app-p2p-order-chat',
  imports: [
    CommonModule,
    IconDirective,
    CustomTranslatePipe,
    DateAgoPipe,
  ],
  templateUrl: './p2p-order-chat.component.html',
  styleUrl: './p2p-order-chat.component.scss',
})
export default class P2pOrderChatComponent {

  paymentOrder = signal<PaymentOrder | null>(null);
  @Input() transactionCredit: any;
  @Output() close = new EventEmitter<void>();

  public authService = inject(AuthService);
  public chatService = inject(ChatService);
  public paymentOrderService = inject(PaymentOrderService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  private router = inject(Router);

  public className = UIStyles;

  constructor() {
    effect(() => {
      this.paymentOrder.set(this.paymentOrderService.paymentOrder());
    });
  }

  confirmP2pUserPayment() {
    this.spinnerService.start();
    const id = this.paymentOrder()?._id!;
    this.paymentOrderService.confirmP2pUserPayment(id, {}).subscribe({
      next: (res) => {
        const { PaymentOrder } = res;
        PaymentOrder ? this.paymentOrderService.addPaymentOrder(PaymentOrder) : null;
        this.toastService.start({ type: 'success', message: 'paymentOrderConfirmed' });
      },
      error: () => {
        this.spinnerService.close();
        this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
      },
      complete: () => this.spinnerService.close()
    });
  }

  confirmP2pSenderReleasePayment() {
    this.spinnerService.start();
    const id = this.paymentOrder()?._id!;
    this.paymentOrderService.confirmP2pSenderReleasePayment(id).subscribe({
      next: (res) => {
        const { PaymentOrder } = res;
        if (PaymentOrder) this.paymentOrderService.addPaymentOrder(PaymentOrder);
        if (PaymentOrder._id) this.router.navigate(['/admin/activity']);
        this.toastService.start({ type: 'success', message: 'paymentOrderConfirmed' });
      },
      error: () => {
        this.spinnerService.close();
        this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
      },
      complete: () => this.spinnerService.close()
    });
  }

  cancelP2pUserOrder() {
    this.spinnerService.start();
    const id = this.paymentOrder()?._id!;
    this.paymentOrderService.cancelP2pUserOrder(id).subscribe({
      next: (res) => {
        const { PaymentOrder } = res;
        if (PaymentOrder) this.paymentOrderService.addPaymentOrder(PaymentOrder);
        if (PaymentOrder._id) this.router.navigate(['/admin/activity']);
        this.toastService.start({ type: 'success', message: 'paymentOrderCancelled' });
      },
      error: () => {
        this.spinnerService.close();
        this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
      },
      complete: () => this.spinnerService.close()
    });
  }

  appealOrDisputeP2pOrder() {
    this.spinnerService.start();
    const id = this.paymentOrder()?._id!;
    this.paymentOrderService.appealOrDisputeP2pOrder(id, {}).subscribe({
      next: (res) => {
        const { PaymentOrder } = res;
        PaymentOrder ? this.paymentOrderService.addPaymentOrder(PaymentOrder) : null;
        this.toastService.start({ type: 'success', message: 'paymentOrderConfirmed' });
      },
      error: () => {
        this.spinnerService.close();
        this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
      },
      complete: () => this.spinnerService.close()
    });
  }

  onClose() {
    this.close.emit();
  }
}
