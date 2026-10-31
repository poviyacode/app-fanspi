import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentRef, inject, OnInit, PLATFORM_ID, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NumericValidator, textNumberValidator, validateCardNumber } from '@core/common/custom-validators.ts';
import { environment } from '@environments/environment';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SpinnerService } from '@services/spinner.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { CountryStateService } from '@services/country-state.service';
import { CountryService } from '@services/country.service';
import { CybersourceService } from '@services/cybersource.service';
import { PaymentOrderService } from '@services/payment-order.service';

import { Subject, takeUntil } from 'rxjs';
import { Tools } from '@core/common/tools';
import HeadPayComponent from '../head-pay/head-pay.component';

import { ToastService } from '@services/toast.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { UserService } from '@services/user.service';
import StripeIncPayComponent from '../stripe-inc-pay/stripe-inc-pay.component';
import StripeLlcPayComponent from '../stripe-llc-pay/stripe-llc-pay.component';
import { ResPaymentOrderPay } from '@interfaces/paymentOrder';
import CybersourcePayComponent from '../cybersource-pay/cybersource-pay.component';
import QrAtcPayComponent from '../qr-atc-pay/qr-atc-pay.component';

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
  templateUrl: './main-pay.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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

  // stripe
  private STRIPE!: any; //TODO: window.Stripe
  private elementStripe!: any;

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

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef: ViewContainerRef;
  private destroy$ = new Subject<void>();

  //component
  private stripeIncPayComponentRef: ComponentRef<StripeIncPayComponent> | null = null;
  private stripeLlcPayComponentRef: ComponentRef<StripeLlcPayComponent> | null = null;
  private cybersourcePayComponentRef: ComponentRef<CybersourcePayComponent> | null = null;
  private qrAtcPayComponentRef: ComponentRef<QrAtcPayComponent> | null = null;

  private platformId = inject(PLATFORM_ID);
  private activeRoute = inject(ActivatedRoute);
  public paymentOrderService = inject(PaymentOrderService);
  private countryService = inject(CountryService);
  private countryStateService = inject(CountryStateService);
  private cybersourceService = inject(CybersourceService);
  private spinnerService = inject(SpinnerService);
  private toastService = inject(ToastService);
  public router = inject(Router);
  private userService = inject(UserService);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.codeCollection = this.activeRoute.snapshot.paramMap.get('code_collection')!;
  }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.paymentOrderService.resetPaymentOrderPay();
      this.findOnePaymentOrder();
    }
  }

  // FIND
  findOnePaymentOrder() {
    this.spinnerService.start();

    this.paymentOrderService.findOneCodeCollectionPay(this.codeCollection)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && res.status === 'PETITION' || res.status === 'DECLINE') {
            this.paymentOrderService.addPaymentOrderPay(res);

            this.isStripeINC.set(res.paymentMethodRole.includes('STRIPE_INC'));
            this.isStripeLLC.set(res.paymentMethodRole.includes('STRIPE_LLC'));
            this.isPayPalBusinessEEUU.set(res.paymentMethodRole.includes('PAYPAL_BUSSINES_EEUU'));
            this.isCyberSourceATCBO.set(res.paymentMethodRole.includes('CYBERSOURSE_ATC_BO'));
            this.isQrAtc.set(res.paymentMethodRole.includes('QR_ATC_BO'));

            this.onPaymentMethodChange(res.paymentMethodRole[0]);

          } else {
            let url = '';
            url = `${res.paymentDetails.urlReturn}/${res.codeCollection}`;
            const link = document.createElement('a');
            link.href = url;
            link.target = '_self';
            document.body.appendChild(link);
            link.click();
          }
        },
        error: (err) => {
          this.spinnerService.close();
          let url = '';
          url = 'https://fanspi.com';
          const link = document.createElement('a');
          link.href = url;
          link.target = '_self';
          document.body.appendChild(link);
          link.click();
          console.error('Error al cargar los posts:', err);
        },
        complete: () => {
          console.log('Request completed');
          this.spinnerService.close();
        }
      });

  }

  onPaymentMethodChange(method: string) {

    this.selectedPaymentMethod.set(method);
    const amountCalculation = this.paymentOrderService?.paymentOrderPay()?.amountCalculation!;

    this.closeComponents();
    console.log(method)
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
    //this.dialogService.toggleModal('creditPurchase');
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

  closeComponents() {
    this.clearStripeINCComponent();
    this.clearStripeLLCComponent();
    this.clearCybersourcePayComponent();
  }
}
