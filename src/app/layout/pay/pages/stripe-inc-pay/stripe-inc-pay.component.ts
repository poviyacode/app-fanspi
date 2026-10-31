import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, OnInit, Output, PLATFORM_ID, signal, ViewChild } from '@angular/core';
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
// STRIPE
import { StripeService } from '@services/stripe.service';
import { ToastService } from '@services/toast.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { UserService } from '@services/user.service';
import { Country } from '@interfaces/country';
import { CountryState } from '@interfaces/countryState';

interface PurchaseItems {
  name: string,
  quantity: number,
  price: number
}
@Component({
  selector: 'app-stripe-inc-pay',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
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
  templateUrl: './stripe-inc-pay.component.html',
  styleUrl: './stripe-inc-pay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class StripeIncPayComponent {

  isBrowser: boolean;
  isServer: boolean;

  selectedPaymentMethod = signal<string>('STRIPE');
  codeCollection: string;
  transaction = signal(false);

  countries = signal<Country[] | null>(null);
  countryStates = signal<CountryState[] | null>(null);

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

  // payment method role
  isStripeINC = signal(false);
  isStripeLLC = signal(false);
  isPayPalBusinessEEUU = signal(false);
  isPayPalPersonalPanama = signal(false);
  isCyberSourceATCBO = signal(false);

  @Output() closeModal = new EventEmitter<void>();
  private destroy$ = new Subject<void>();

  @ViewChild('content', { static: true }) content!: ElementRef;
  capturedImage: string | null = null;

  private platformId = inject(PLATFORM_ID);
  private activeRoute = inject(ActivatedRoute);
  public paymentOrderService = inject(PaymentOrderService);
  private countryService = inject(CountryService);
  private countryStateService = inject(CountryStateService);
  private cybersourceService = inject(CybersourceService);
  private spinnerService = inject(SpinnerService);
  private stripeService = inject(StripeService);
  private toastService = inject(ToastService);
  public router = inject(Router);
  private userService = inject(UserService);

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.codeCollection = this.activeRoute.snapshot.paramMap.get('code_collection')!;
  }

  ngOnInit(): void {
    this.createFormControls();
    if (this.isBrowser) {
      this.initStripe();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {

  }

  createFormControls() {

    this.myFormStripe = new FormGroup({
      //amount: new FormControl('', [Validators.required, Validators.min(1), Validators.max(100000)]),
      cardNumber: new FormControl(false, [Validators.required, Validators.requiredTrue]), //TODO true | false
      cardCvv: new FormControl(false, [Validators.required, Validators.requiredTrue]),//TODO true | false
      cardExp: new FormControl(false, [Validators.required, Validators.requiredTrue]),//TODO true | false
      termsOne: new FormControl(true, Validators.requiredTrue),
      termsTwo: new FormControl(true, Validators.requiredTrue),
    })
  }

  // STRIPE
  initStripe() {
    const url = 'https://js.stripe.com/v3/';
    let node = document.createElement('script');
    node.src = url;
    node.onload = () => {
      // Esto se ejecutará cuando el script de Stripe haya terminado de cargarse
      this.STRIPE = window.Stripe(environment.stripe_pk_inc);
      this.createStripeElement();
    };
    document.getElementsByTagName('head')[0].appendChild(node);
  }

  private createStripeElement = () => {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const style = {
      base: {
        color: isDarkMode ? '#ffffff' : '#000000',
        fontWeight: 400,
        // fontFamily: '\'Poppins\', sans-serif',
        // fontSize: '20px',
        '::placeholder': {
          color: isDarkMode ? '#666666' : '#E3E2EC',
        },
      },
      invalid: {
        color: isDarkMode ? '#ff4d4d' : '#dc3545',
      },
    };

    // TODO: SDK de Stripe inicia la generación de elementos
    this.elementStripe = this.STRIPE.elements({
      fonts: [
        {
          cssSrc: 'https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400&display=swap',
        },
      ],
    });

    // TODO: SDK Construimos los inputs de tarjeta, CVC, fecha con estilos
    const cardNumber = this.elementStripe.create('cardNumber', {
      placeholder: '4242 4242 4242 4242',
      style,
      classes: {
        base: 'input-stripe-custom',
      },
    });
    const cardExp = this.elementStripe.create('cardExpiry', {
      placeholder: 'MM/AA',
      style,
      classes: {
        base: 'input-stripe-custom',
      },
    });
    const cardCvc = this.elementStripe.create('cardCvc', {
      placeholder: '000',
      style,
      classes: {
        base: 'input-stripe-custom',
      },
    });

    // TODO: SDK Montamos los elementos en nuestros DIV identificados con el #id
    cardNumber.mount('#card');
    cardExp.mount('#exp');
    cardCvc.mount('#cvc');

    this.cardNumber = cardNumber;
    this.cardExp = cardExp;
    this.cardCvv = cardCvc;

    // TODO: Escuchamos los eventos del SDK
    this.cardNumber.addEventListener('change', this.onChangeCard.bind(this));
    this.cardExp.addEventListener('change', this.onChangeExp.bind(this));
    this.cardCvv.addEventListener('change', this.onChangeCvv.bind(this));
  }

  async submitStripe(): Promise<any> {
    try {

      this.myFormStripe.disable();
      this.spinnerService.start();
      //TODO: SDK de Stripe genera un TOKEN para la intencion de pago!
      const { token } = await this.STRIPE.createToken(this.cardNumber)
      //console.log('TOKEN', { token })

      //TODO: Enviamos el token a nuesta api donde generamos (stripe) un metodo de pago basado en el token
      //TODO: tok_23213

      const { name, lastname, email } = this.userService.personal()!;

      const dataGenerate = {
        codeCollection: this.codeCollection,
        amount: Number(this.paymentOrderService.amountCalculation()!.amountTransaction),
        token: token.id,
        ...this.userService.personal(),
        User: this.paymentOrderService.paymentOrderPay()?.Sender
      };

      const resStripe: any = await this.stripeService.generatePaymentInc(dataGenerate)
      //console.log('DATA', { resStripe })

      //TODO: Nuestra api devolver un "client_secret" que es un token unico por intencion de pago
      //TODO: SDK de stripe se encarga de verificar si el banco necesita autorizar o no
      this.STRIPE.handleCardPayment(resStripe.client_secret)
        .then(async () => {

          //TODO: 👌 Money Money!!!
          //alert('Dinerito dineron')
          // this.toaster.open({text: 'Dinerito dineron', caption: 'Yeah!', type: 'success'})

          //TODO: Enviamos el id "localizador" de nuestra orden para decirle al backend que confirme con stripe si es verdad!
          const decision = await this.stripeService.getPaymentDetailInc(resStripe.id)

          const dataCustomer = {
            ...this.userService.personal(),
            ...this.paymentOrderService.amountCalculation(),
            codeCollection: this.paymentOrderService.paymentOrderPay()?.codeCollection,
            receipt: resStripe,
            decision: decision,
            production: environment.production
          }

          this.paymentOrderService.transactionStripe(this.paymentOrderService.paymentOrderPay()?._id!, dataCustomer)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res) => {
                if (res) {
                  this.router.navigate(['/pay/notification', this.codeCollection]);
                }
              },
              error: (err) => {
                this.myFormStripe.enable();
                this.spinnerService.close();
                this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
              },
              complete: () => {
                this.spinnerService.close();
                this.myFormStripe.enable();
                this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
                //console.log('Request completed');
              }
            })
        })
        .catch(() => {
          //alert('Error con el pago')
          this.myFormStripe.enable();
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
          // this.toaster.open('Error con el pago')
        })
    } catch (e) {
      //alert('Algo ocurrio mientras procesaba el pago')
      this.myFormStripe.enable();
      this.spinnerService.close();
      this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
      // this.toaster.open({text: 'Algo ocurrio mientras procesaba el pago', caption: 'ERROR', type: 'danger'})
    }

  }

  //TODO: Manejadores de validacion de input de stripe

  onChangeCard({ error }: any) {
    this.myFormStripe.patchValue({ cardNumber: !error });
  }

  onChangeCvv({ error }: any) {
    this.myFormStripe.patchValue({ cardCvv: !error });
  }

  onChangeExp({ error }: any) {
    this.myFormStripe.patchValue({ cardExp: !error });
  }

  onCancelTransaction(): void {
    let url = '';
    url = this.paymentOrderService.paymentOrderPay()?.gatewayDetails.urlReturn;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
  }

  onCloseModal() {
    this.closeModal.emit(); // Notifica al padre que el modal se cerró
  }

  // INPUT CLASS
  cardClass() {
    return Tools.cardClass();
  }

  selectClass(formGroup: FormGroup, controlName: string) {
    return Tools.inputClass(formGroup, controlName);
  }

  inputClass(formGroup: FormGroup, controlName: string) {
    return Tools.inputClass(formGroup, controlName);
  }

  textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return Tools.textareaClass(formGroup, controlName, height);
  }

}

