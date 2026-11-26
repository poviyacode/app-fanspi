import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, signal, ViewChild, ViewContainerRef, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UIStyles } from '@core/common/uistyles';
import { TransactionCredit } from '@interfaces/transactionCredit';
import { SpinnerService } from '@services/spinner.service';
import { ToastService } from '@services/toast.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { PaymentMethodService } from '@services/payment-method.service';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '@services/user.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { PaymentMethodCategoryService } from '@services/payment-method-category.service';
import { PaymentMethod } from '@interfaces/paymentMethod';

@Component({
  selector: 'app-withdrawal-money-activity',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    IconDirective
  ],
  templateUrl: './withdrawal-money-activity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './withdrawal-money-activity.component.scss'
})
export default class WithdrawalMoneyActivityComponent {

  isLoading = signal<boolean>(false);
  public className = UIStyles;
  public minTotalWithdrawal = 20;
  selectedPaymentMethod = signal<PaymentMethod | null>(null);

  private destroy$ = new Subject<void>();

  @Output() cancelWithdrawal = new EventEmitter<void>();
  @Output() sendWithdrawal = new EventEmitter<{ amount: string, paymentMethod: string }>();

  myForm: FormGroup;

  public dialogService = inject(DialogService);
  public transactionCreditService = inject(TransactionCreditService);
  public paymentMethodService = inject(PaymentMethodService);
  private authService = inject(AuthService);
  public router = inject(Router);
  public userService = inject(UserService);
  public paymentMethodCategoryService = inject(PaymentMethodCategoryService);

  ngOnInit(): void {
    this.createFormControls();

    if (this.authService.user()) {
      this.findAllUser();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {
    const profitValue = this.userService.userCurrent()?.UserCredit?.current;
    this.myForm = new FormGroup({
      amount: new FormControl(profitValue, [
        Validators.required,
        Validators.min(20),
        Validators.max(Number(profitValue)),
        Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')
      ])
    });
  }

  // find 
  findAllUser(): void {
    const data = {
      userId: this.authService.user()?._id
    };
    this.paymentMethodService.findAllUser(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ paymentMethods, creditCalculator }) => {
          if (paymentMethods) {
            this.paymentMethodService.addPaymentMethods(paymentMethods!);
          }

          if (creditCalculator) {
            this.transactionCreditService.addCreditCalculator(creditCalculator!);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      })
  }

  onSubmit(): void {
    if (this.myForm.status === 'VALID' && this.selectedPaymentMethod()) {
      this.onClose();
      this.sendWithdrawal.emit({
        amount: this.myForm.value.amount,
        paymentMethod: this.selectedPaymentMethod()!._id!
      });
    }
  }

  onClose() {
    this.cancelWithdrawal.emit();
  }

  //  input class
  inputClass(formGroup: FormGroup, controlName: string,) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  cardModalClass() {
    return UIStyles.cardModalClass();
  }
}
