import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, Component, ComponentRef, inject, OnInit, PLATFORM_ID, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SpinnerService } from '@services/spinner.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';;
import { PaymentOrderService } from '@services/payment-order.service';

import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { Tools } from '@core/common/tools';
import HeadPayComponent from '../head-pay/head-pay.component';

import { ToastService } from '@services/toast.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { UserService } from '@services/user.service';
import StripeIncPayComponent from '../stripe-inc-pay/stripe-inc-pay.component';
import StripeLlcPayComponent from '../stripe-llc-pay/stripe-llc-pay.component';
import { PayWithOrder, ResPaymentOrderPay } from '@interfaces/paymentOrder';
import CybersourcePayComponent from '../cybersource-pay/cybersource-pay.component';
import QrAtcPayComponent from '../qr-atc-pay/qr-atc-pay.component';
import { DialogService } from '@services/dialog.service';
import { SocketService } from '@services/socket.service';
import PersonalPayComponent from '../personal-pay/personal-pay.component';
import PixAtcPayComponent from '../pix-atc-pay/pix-atc-pay.component';

@Component({
  selector: 'app-main-pay',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    HeadPayComponent,
    IconDirective
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
  templateUrl: './main-pay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './main-pay.component.scss'
})
export default class MainPayComponent {

  isBrowser: boolean;
  isServer: boolean;

  selectedPaymentMethod = signal<string>('STRIPE');
  codeCollection: string;
  transaction = signal(false);

  // personal
  myFormPersonal: FormGroup;
  isVerifiedPersonal = signal(false);

  myFormStripe: FormGroup = new FormGroup({})

  cardNumber: any;
  cardCvv: any;
  cardExp: any;

  method: string;
  paymentOrderPay: ResPaymentOrderPay;

  // payment method role
  isStripeINC = signal(false);
  isStripeLLC = signal(false);
  isPayPalBusinessEEUU = signal(false);
  isPayPalPersonalPanama = signal(false);
  isCyberSourceATCBO = signal(false);
  isQrAtc = signal(false);

  // form
  paymentForm: FormGroup;

  // variables
  amountPay = signal(0);
  currencyPay = signal('');
  partialAmount = signal(0);

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef: ViewContainerRef;
  private destroy$ = new Subject<void>();

  //component
  private stripeIncPayComponentRef: ComponentRef<StripeIncPayComponent> | null = null;
  private stripeLlcPayComponentRef: ComponentRef<StripeLlcPayComponent> | null = null;
  private cybersourcePayComponentRef: ComponentRef<CybersourcePayComponent> | null = null;
  private qrAtcPayComponentRef: ComponentRef<QrAtcPayComponent> | null = null;
  private personalPayComponentRef: ComponentRef<PersonalPayComponent> | null = null;
  private pixAtcPayComponentRef: ComponentRef<PixAtcPayComponent> | null = null;

  private platformId = inject(PLATFORM_ID);
  private activeRoute = inject(ActivatedRoute);
  public paymentOrderService = inject(PaymentOrderService);
  private spinnerService = inject(SpinnerService);
  private toastService = inject(ToastService);
  public router = inject(Router);
  private userService = inject(UserService);
  public dialogService = inject(DialogService);
  public socketService = inject(SocketService);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.codeCollection = this.activeRoute.snapshot.paramMap.get('code_collection')!;
    this.createFormControls();
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.userOnlineSocket();
    }
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.paymentOrderService.resetPaymentOrderPay();
      this.findOnePaymentOrder();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  createFormControls() {
    this.paymentForm = new FormGroup({
      amount: new FormControl<number>(0, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(1),
          this.amountExceededValidator()
        ]
      })
    });

    this.paymentForm.get('amount')?.valueChanges.pipe(
      debounceTime(800),
      distinctUntilChanged()
    ).subscribe(value => {
      this.paymentForm.get('amount')?.updateValueAndValidity({ emitEvent: false });
    });

  }

  get formattedPartialAmount(): number {
    const value = this.paymentForm.get('amount')?.value;
    // Eliminamos cualquier carácter que no sea número o punto, y convertimos a número
    const cleanValue = String(value).replace(/[^0-9.]/g, '');
    return parseFloat(cleanValue) || 0;
  }

  isAmountInvalid(): boolean {
    const max = this.paymentOrderService.paymentOrderPay()?.remainingAmount || 0;
    return this.paymentForm.get('amount')!.value > max || this.paymentForm.invalid;
  }

  amountExceededValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const max = this.paymentOrderService.paymentOrderPay()?.remainingAmount || 0;
      const value = control.value;
      return value > max ? { exceeded: true } : null;
    };
  }

  // FIND
  findOnePaymentOrder() {
    this.spinnerService.start();

    this.paymentOrderService.findOneCodeCollectionPay(this.codeCollection)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {

          if (res && (res.status === 'PETITION' || res.status === 'PENDING')) {

            this.paymentOrderService.addPaymentOrderPay(res);
            this.verifiedPersonal();

            this.isStripeINC.set(res.paymentMethodRole.includes('STRIPE_INC'));
            this.isStripeLLC.set(res.paymentMethodRole.includes('STRIPE_LLC'));
            this.isPayPalBusinessEEUU.set(res.paymentMethodRole.includes('PAYPAL_BUSSINES_EEUU'));
            this.isCyberSourceATCBO.set(res.paymentMethodRole.includes('CYBERSOURSE_ATC_BO'));
            this.isQrAtc.set(res.paymentMethodRole.includes('QR_ATC_BO'));

            this.selectedPaymentMethod.set(res.paymentMethodRole[0]);
            this.onPaymentMethodChange(this.selectedPaymentMethod());
            this.setFullAmount();

          } else {
            let url = '';
            url = `${res!.gatewayDetails.urlReturn}/${res!.codeCollection}`;
            const link = document.createElement('a');
            link.href = url;
            link.target = '_self';
            document.body.appendChild(link);
            link.click();
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
          this.router.navigate(['/']);
        },
        complete: () => {
          this.spinnerService.close();
        }
      });

  }

  // amount calculation
  onAmountCalculation(amount: number) {

    this.amountPay.set(Number(amount));
    this.currencyPay.set(this.paymentOrderService.paymentOrderPay()!.Money?.iso!);

    this.spinnerService.start();

    const data = {
      amountPay: Number(this.amountPay()),
      currencyPay: this.currencyPay(),
      paymentMethod: this.selectedPaymentMethod(),
    }

    this.paymentOrderService.amountCalculationPay(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.paymentOrderService.addAmountCalculation(res);
        },
        error: (err) => {
          this.spinnerService.close();
        },
        complete: () => {
          this.spinnerService.close();
        }
      });
  }

  // verified personal
  verifiedPersonal() {
    const { name, lastname, email, phonePrefix, phone, address, city, Country, CountryState, postalCode } =
      this.paymentOrderService.paymentOrderPay()?.User || {};
    this.userService.addPersonal({ name, lastname, email, phonePrefix, phone, address, city, Country, CountryState, postalCode });

    if (
      name &&
      lastname &&
      email &&
      phonePrefix &&
      phone &&
      address &&
      city &&
      Country &&
      CountryState &&
      postalCode
    ) {
      this.isVerifiedPersonal.set(true);
    } else {
      this.isVerifiedPersonal.set(false);
    }

    this.onPersonal();
  }

  onPaymentMethodChange(method: string) {

    this.selectedPaymentMethod.set(method);
    const amountCalculation = this.paymentOrderService?.paymentOrderPay()?.amountCalculation!;
    this.closeComponents();

    if (method === 'PAYPAL') {
    } else if (method === 'STRIPE_LLC') {
      this.paymentOrderService.addAmountCalculation(amountCalculation.StripeLLC!);
      this.onStripeLLC();
    } else if (method === 'STRIPE_INC') {
      this.paymentOrderService.addAmountCalculation(amountCalculation.StripeINC!);
      this.onStripeINC();
    } else if (method === 'CYBERSOURSE_ATC_BO') {
      this.paymentOrderService.addAmountCalculation(amountCalculation.CyberSource!);
      this.onCyberSource();
    } else if (method === 'QR_ATC_BO') {
      this.paymentOrderService.addAmountCalculation(amountCalculation.CyberSource!);
      this.onQrAtc();
    } else if (method === 'PIX_ATC_BO') {
      this.paymentOrderService.addAmountCalculation(amountCalculation.CyberSource!);
      this.onPixAtc();
    }
  }

  onSubmit() {
    const amount = this.paymentForm.get('amount')?.value;
    if (amount && this.paymentForm.valid) {
      this.dialogService.closeModal();

      const data: PayWithOrder = {
        partialAmount: Number(amount),
        Money: this.paymentOrderService.paymentOrderPay()?.Money,
        paymentMethod: this.selectedPaymentMethod(),
        codeCollection: this.codeCollection,
      }
      this.paymentOrderService.addPayWithOrder(data);
      this.onPaymentMethodChange(this.selectedPaymentMethod());
    }
  }

  openAddAmountModal() {
    this.dialogService.toggleModal('addAmount');
  }

  onCloseModalPaymentForm() {
    if (this.paymentForm.valid) {
      this.dialogService.closeModal();
    }
  }

  setFullAmount(): void {
    const remainingAmount = this.paymentOrderService.paymentOrderPay()?.remainingAmount || 0;
    const amountControl = this.paymentForm.get('amount');
    amountControl?.setValue(Number(remainingAmount));
    amountControl?.updateValueAndValidity();

    const data: PayWithOrder = {
      partialAmount: Number(remainingAmount),
      Money: this.paymentOrderService.paymentOrderPay()?.Money,
      paymentMethod: this.selectedPaymentMethod(),
      codeCollection: this.codeCollection,
    }
    this.paymentOrderService.addPayWithOrder(data);
  }

  onlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    const currentValue = (event.target as HTMLInputElement).value;

    // Permitir el punto decimal solo una vez
    if (charCode === 46) {
      if (currentValue.includes('.')) {
        event.preventDefault();
        return;
      }
      return;
    }

    // Bloquear cualquier tecla que no sea número (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onRedirectPayment(method: string) {
    if (method === 'STRIPE_INC') {
      const route = `pay/stripe_inc`;
      this.router.navigate([`${route}`, this.codeCollection]);
    } else if (method === 'STRIPE_LLC') {
      const route = `pay/stripe_llc`;
      this.router.navigate([`${route}`, this.codeCollection]);
    } else if (method === 'CYBERSOURSE_ATC_BO') {
      const route = `pay/cybersource`;
      this.router.navigate([`${route}`, this.codeCollection]);
    }
  }

  // socket
  userOnlineSocket() {

    if (!this.socketService.socket) {
      this.socketService.connect();
    }

    this.socketService.listen('paymentStatusUpdated')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'PAID') {
            // ¡Pago exitoso! Redirigir a confirmación
          } else if (response.status === 'DECLINE') {
            // Pago rechazado o QR expirado
          }

          const route = `pay/notification`;
          this.router.navigate([`${route}`, this.codeCollection]);
        },
        error: (err) => {
          console.error('Payment channel error:');
        },
        complete: () => {
          console.log('Request completed');
        }
      });
  }

  // edit personal info
  onEditProfileInfo() {
    this.onPersonal();
  }

  // Método puente que obtiene el mensaje final a través del servicio
  get currentOrder() {
    return this.paymentOrderService.paymentOrderPay();
  }
  getErrorMessage(): string | null {
    return this.paymentOrderService.getErrorMessage(this.currentOrder);
  }

  // components
  onStripeINC() {
    this.clearStripeINCComponent();
    const componentRef = this.viewContainerRef.createComponent(StripeIncPayComponent);
    this.stripeIncPayComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearStripeINCComponent(); // Destruye el componente hijo
      //this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    //this.dialogService.toggleModal('creditPurchase');
  }

  private clearStripeINCComponent() {
    if (this.stripeIncPayComponentRef) {
      this.stripeIncPayComponentRef.destroy();
      this.stripeIncPayComponentRef = null;
    }
  }

  onStripeLLC() {
    this.clearStripeLLCComponent();
    const componentRef = this.viewContainerRef.createComponent(StripeLlcPayComponent);
    this.stripeLlcPayComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearStripeLLCComponent(); // Destruye el componente hijo
      //this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    //this.dialogService.toggleModal('creditPurchase');
  }

  private clearStripeLLCComponent() {
    if (this.stripeLlcPayComponentRef) {
      this.stripeLlcPayComponentRef.destroy();
      this.stripeLlcPayComponentRef = null;
    }
  }

  onCyberSource() {
    this.clearCybersourcePayComponent();
    const componentRef = this.viewContainerRef.createComponent(CybersourcePayComponent);
    this.cybersourcePayComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearCybersourcePayComponent(); // Destruye el componente hijo
      //this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    //this.dialogService.toggleModal('infoPersonalPay');
  }

  private clearCybersourcePayComponent() {
    if (this.cybersourcePayComponentRef) {
      this.cybersourcePayComponentRef.destroy();
      this.cybersourcePayComponentRef = null;
    }
  }

  onQrAtc() {
    this.clearQrAtcPayComponent();
    const componentRef = this.viewContainerRef.createComponent(QrAtcPayComponent);
    this.qrAtcPayComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearQrAtcPayComponent(); // Destruye el componente hijo
      //this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    //this.dialogService.toggleModal('creditPurchase');
  }

  private clearQrAtcPayComponent() {
    if (this.qrAtcPayComponentRef) {
      this.qrAtcPayComponentRef.destroy();
      this.qrAtcPayComponentRef = null;
    }
  }

  onPixAtc() {
    this.clearPixAtcPayComponent();
    const componentRef = this.viewContainerRef.createComponent(PixAtcPayComponent);
    this.pixAtcPayComponentRef = componentRef;
    componentRef.instance.closeModal.subscribe(() => {
      this.clearPixAtcPayComponent(); // Destruye el componente hijo
      //this.dialogService.closeModal(); // Cierra el modal visualmente
    });
    //this.dialogService.toggleModal('creditPurchase');
  }

  private clearPixAtcPayComponent() {
    if (this.pixAtcPayComponentRef) {
      this.pixAtcPayComponentRef.destroy();
      this.pixAtcPayComponentRef = null;
    }
  }

  onPersonal() {
    // 1. Primero abrimos el modal para que el @if se active y exponga el contenedor en el HTML
    this.dialogService.toggleModal('infoPersonalPay');

    // 2. Limpiamos cualquier residuo anterior
    this.clearPersonalPayComponent();

    // 3. Usamos un micro-timeout para dar tiempo a que el DOM procese el @if
    setTimeout(() => {
      if (!this.viewContainerRef) {
        console.error('El contenedor aún no está listo en el DOM');
        return;
      }

      // 4. Ahora sí creamos el componente de forma segura dentro del contenedor ya renderizado
      const componentRef = this.viewContainerRef.createComponent(PersonalPayComponent);

      // 5. Guardamos la referencia de manera segura (¡ya no fallará!)
      this.personalPayComponentRef = componentRef;

      // 6. Nos suscribimos al evento de cierre
      componentRef.instance.closeModal.subscribe(() => {
        console.log('The modal is closed from the child');
        this.clearPersonalPayComponent(); // Ahora sí lo destruirá de verdad en memoria
        this.dialogService.closeModal();
      });
    }, 50); // 50ms son suficientes para el renderizado del @if
  }

  private clearPersonalPayComponent() {
    if (this.personalPayComponentRef) {
      this.personalPayComponentRef.destroy();
      this.personalPayComponentRef = null;
    }
  }

  closeComponents() {
    this.clearStripeINCComponent();
    this.clearStripeLLCComponent();
    this.clearCybersourcePayComponent();
    this.clearQrAtcPayComponent();
    this.clearPixAtcPayComponent();
    this.clearPersonalPayComponent();
  }

  // COMMON CLASS
  cardClass() {
    return Tools.cardClass();
  }

  modalClass() {
    return Tools.modalClass();
  }

  buttonSecondaryClass() {
    return Tools.buttonSecondaryClass();
  }

  buttonPrimaryClass() {
    return Tools.buttonPrimaryClass();
  }
}
