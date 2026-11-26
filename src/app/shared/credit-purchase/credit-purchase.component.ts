import { Component, EventEmitter, inject, Output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { SpinnerService } from '../../services/spinner.service';
import { PaymentOrderService } from '../../services/payment-order.service';
import { buyCredit } from '../../core/common/custom-validators.ts';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../services/dialog.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { UIStyles } from '@core/common/uistyles';
import { ProductCreditService } from '@services/product-credit.service';
import { filter, Subject, takeUntil } from 'rxjs';
import { ToastService } from '@services/toast.service';
import { ToolsService } from '@services/tools.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { ProductCredit } from '@interfaces/productCredit';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Money } from '@interfaces/money';
import { UserService } from '@services/user.service';
import { PaymentMethodCategoryService } from '@services/payment-method-category.service';
import { PaymentMethodCategory } from '@interfaces/paymentMethodCategory';
import { PaymentOrder } from '@interfaces/paymentOrder';

@Component({
  selector: 'app-credit-purchase',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    IconDirective
  ],
  templateUrl: './credit-purchase.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './credit-purchase.component.scss'
})
export class CreditPurchaseComponent {

  isTest = signal<boolean>(true);
  public className = UIStyles;

  myform: FormGroup;
  bonus = signal<number>(0);
  totalPrice = signal<number>(0);
  money = signal<Money | null>(null);
  currentStep = signal<'purchase' | 'categories'>('purchase');
  selectedPaymentMethodCategory = signal<PaymentMethodCategory | null>(null);

  @Output() closeModal = new EventEmitter<void>();
  private destroy$ = new Subject<void>();

  public dialogService = inject(DialogService);
  private authService = inject(AuthService);
  private spinnerService = inject(SpinnerService);
  private paymentOrderService = inject(PaymentOrderService);
  public productCreditService = inject(ProductCreditService);
  public toastService = inject(ToastService);
  public toolsService = inject(ToolsService);
  public transactionCreditService = inject(TransactionCreditService);
  public router = inject(Router);
  public userService = inject(UserService);
  public paymentMethodCategoryService = inject(PaymentMethodCategoryService);

  constructor() {
    if (environment.production) {
      this.isTest.set(false);
    }
  }

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
      credit: new FormControl({ value: 10, disabled: true }, [Validators.required, buyCredit]),
    });

    this.myform.get('selectCredit')!.valueChanges.subscribe(value => {
      if (value === 'custom') {
        this.myform.get('credit')!.enable();
      } else {
        this.myform.get('credit')!.reset(10);
        this.myform.get('credit')!.disable();
        this.updateTotalPrice(value);
      }
    });

    this.myform.get('credit')!.valueChanges.subscribe(value => {

      if (this.myform.get('selectCredit')!.value === 'custom' && value) {
        const quantityCoin = Number(value);
        const selectedCredit = this.getCoinObject(this.productCreditService.productCredits(), quantityCoin)
        const bonus = selectedCredit?.bonus || 0;
        this.bonus.set(bonus);
        const price = this.calculatePrice(quantityCoin, bonus);
        this.updateTotalPrice(price);
      }

      if (Number(value) < 10 || Number(value) > 500) {
        this.totalPrice.set(10);
      } else {

      }
    });
  }

  updateTotalPrice(creditValue: any) {
    const selectedCredit = this.productCreditService.productCredits()!.find(item => item.credit == creditValue);
    if (selectedCredit) {
      const price = this.calculatePrice(creditValue, selectedCredit.bonus!);
      this.totalPrice.set(price!);
    } else {
      this.totalPrice.set(creditValue);
    }
  }

  // calculate price
  calculatePrice(quantityCoin: number, bonus: number) {
    const priceCoin = Number(this.transactionCreditService.creditCalculator()?.priceCoin);
    const price = Number((quantityCoin * priceCoin - priceCoin * bonus).toFixed(2));
    return price;
  }

  getCoinObject(coinList: ProductCredit[], inputCoins: number) {
    const sortedList = [...coinList].sort((a, b) => a.credit! - b.credit!);
    for (let i = sortedList.length - 1; i >= 0; i--) {
      if (inputCoins >= sortedList[i].credit!) {
        return sortedList[i];
      }
    }

    return null;
  }

  // find 
  findAll() {
    this.productCreditService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.productCreditService.resetProductCredits();
          const currentPostsUser = this.productCreditService.productCredits();
          const updatedPostsUser = [...currentPostsUser, ...res.list];
          this.productCreditService.addProductCredits(updatedPostsUser);

          this.transactionCreditService.addCreditCalculator(res.creditCalculator);

          if (res.list.length > 0) {
            this.money.set(res.list[0].Money!);
          }
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

    this.onCloseModal();

    if (this.myform.valid && this.authService.user()!) {
      this.spinnerService.start();

      const data = {
        amount: Number(this.totalPrice()),
        currency: this.money()?.iso,
        paymentCategoryId: '6ab51a83b134ea28b2e868db',
        movementType: 'INCOME',
        paymentDetails: {
          transaction: 'sale_credit',
          credit: Number(this.myform.value.selectCredit === 'custom' ? this.myform.value.credit : this.myform.value.selectCredit),
        },
        gateway: 'POVIYA'
      }

      this.paymentOrderService.create(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {
              let url = `${res.gatewayDetails?.urlCheckout}`;
              window.open(`${url}`, "_parent", "noopener,noreferrer");
            }
          },
          error: (err) => {
            this.spinnerService.close();
            this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
          },
          complete: () => {
            this.spinnerService.close();
            console.log('Request completed');
          }
        })
    }
  }

  // p2p2
  // Maneja la selección y la transición de modales
  async findAllPaymentMethodCategories(): Promise<void> {
    const data = {
      operationType: ["DEPOSIT"],
      status: 'ACTIVE'
    };
    this.paymentMethodCategoryService.findAll(data).
      pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res) {
          this.paymentMethodCategoryService.addPaymentMethodCategories(res.data!);
          this.dialogService.toggleModal('listPaymentMethodCategories');
        }
      });
  }

  onMethodPaymentCategories() {
    this.findAllPaymentMethodCategories();
    this.currentStep.set('categories'); // Cambia a la vista de categorías
  }

  onBackToPurchase() {
    this.currentStep.set('purchase');
  }

  onSubmitP2p() {
    this.onCloseModal();

    if (this.myform.valid && this.authService.user()!) {
      this.spinnerService.start();

      const data = {
        amount: Number(this.totalPrice()),
        currency: this.money()?.iso,
        movementType: 'P2P',
        paymentDetails: {
          paymentMethodCategoryId: this.selectedPaymentMethodCategory()!._id,
          transaction: 'sale_credit',
          credit: Number(this.myform.value.selectCredit === 'custom' ? this.myform.value.credit : this.myform.value.selectCredit),
        },
        gateway: 'P2P'
      }
      this.paymentOrderService.createP2pRequest(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {
              this.paymentOrderService.addPaymentOrder(res);
              this.dialogService.toggleModal('p2pSearching');
            }
          },
          error: (err) => {
            this.spinnerService.close();
            this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
          },
          complete: () => {
            this.spinnerService.close();
            console.log('Request completed');
          }
        })
    }
  }

  // close
  onCloseModal() {
    this.closeModal.emit(); // Notifica al padre que el modal se cerró
  }

}
