import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { SpinnerService } from '../../services/spinner.service';
import { PaymentOrderService } from '../../services/payment-order.service';
import { buyCredit } from '../../core/common/custom-validators.ts';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { DynamicComponentService } from '../../services/dinamic-component.service';
import { DialogService } from '../../services/dialog.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Tools } from '@core/common/tools';
import { DirectiveModule } from '@directive/directive.module';
import { ProductCreditService } from '@services/product-credit.service';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '@services/toast.service';
import { ToolsService } from '@services/tools.service';
import { TransactionCreditService } from '@services/transaction-credit.service';

@Component({
  selector: 'app-credit-purchase',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    DirectiveModule
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
  templateUrl: './credit-purchase.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './credit-purchase.component.scss'
})
export class CreditPurchaseComponent {

  myform: FormGroup;
  bonus = signal<number>(0);
  totalPrice = signal<number>(0);

  private destroy$ = new Subject<void>();

  public dialogService = inject(DialogService);
  private authService = inject(AuthService);
  private spinnerService = inject(SpinnerService);
  private paymentOrderService = inject(PaymentOrderService);
  public productCreditService = inject(ProductCreditService);
  public toastService = inject(ToastService);
  public toolsService = inject(ToolsService);
  public transactionCreditService = inject(TransactionCreditService);

  ngOnInit(): void {
    this.findAll();
    this.createFormControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {
    this.myform = new FormGroup({
      selectCredit: new FormControl('', [Validators.required,]),
      credit: new FormControl({ value: 0, disabled: true }, [Validators.required, buyCredit]),
    });

    this.myform.get('selectCredit')!.valueChanges.subscribe(value => {
      if (value === 'custom') {
        this.myform.get('credit')!.enable();
        this.totalPrice.set(0);
      } else {
        this.myform.get('credit')!.reset(0);
        this.myform.get('credit')!.disable();
        this.updateTotalPrice(value);
      }
    });

    this.myform.get('credit')!.valueChanges.subscribe(value => {

      if (this.myform.get('selectCredit')!.value === 'custom' && value) {
        const quantityCoin = Number(value);
        const selectedCredit = this.productCreditService.productCredits().find(item => quantityCoin >= item.credit! && quantityCoin < (item.credit! + 100));
        const bonus = selectedCredit?.bonus || 0;
        this.bonus.set(bonus);
        const priceCoinUnitBuyParallel = Number(this.transactionCreditService.creditCalculator()?.priceCoinUnitBuyParallel);
        const price = Number((quantityCoin * priceCoinUnitBuyParallel - priceCoinUnitBuyParallel * bonus).toFixed(2));
        this.updateTotalPrice(price);
      }

      if (Number(value) < 10 || Number(value) > 500) {
        this.totalPrice.set(0);
      } else {

      }
    });
  }

  updateTotalPrice(creditValue: any) {
    const selectedCredit = this.productCreditService.productCredits()!.find(item => item.credit == creditValue);
    if (selectedCredit) {
      this.totalPrice.set(selectedCredit.priceTotal!);
    } else {
      this.totalPrice.set(creditValue);
    }
  }

  // find 
  findAll() {
    this.productCreditService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.productCreditService.resetProductCredits();
          const currentPostsUser = this.productCreditService.productCredits();
          const updatedPostsUser = [...currentPostsUser, ...res];
          this.productCreditService.addProductCredits(updatedPostsUser);
        },
        error: (err) => {
        },
        complete: () => {
          console.log('Request completed');
        }
      });
  }

  // register
  onSubmit(): void {

    if (this.myform.valid && this.authService.user()!) {
      this.spinnerService.start();

      const data = {
        amount: Number(this.totalPrice()),
        currency: 'USD',
        paymentType: 'SALE_CREDIT',
        paymentDetails: {
          urlCurrent: ``,
          urlCallback: '',
          urlReturn: `https://${environment.domain}/pay/notification`,
          transaction: 'sale_credit',
          credit: Number(this.myform.value.selectCredit === 'custom' ? this.myform.value.credit : this.myform.value.selectCredit),
        }
      }

      this.closeModal();
      this.paymentOrderService.createPaymentOrder(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {
              let url = 'https://fanspi.com/pay/checkout/' + res.codeCollection;
              window.open(`${url}`, "_parent", "noopener,noreferrer");

              this.spinnerService.close();
            }
          },
          error: (err) => {
            this.spinnerService.close();
            this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
          },
          complete: () => {
            console.log('Request completed');
          }
        })
    }
  }

  onBuyCurrency() {

  }

  closeModal() {
    this.dialogService.closeModal();
  }

  inputClass(formGroup: FormGroup, controlName: string) {
    return Tools.inputClass(formGroup, controlName);
  }
}
