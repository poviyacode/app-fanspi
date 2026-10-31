import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NumericValidator, textNumberValidator, validateCardNumber } from '@core/common/custom-validators.ts';
import { environment } from '@environments/environment';
import { Country } from '@interfaces/country';
import { CountryState } from '@interfaces/countryState';
import { SpinnerService } from '@services/spinner.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { CountryStateService } from '@services/country-state.service';
import { CountryService } from '@services/country.service';
import { CybersourceService } from '@services/cybersource.service';
import { PaymentOrderService } from '@services/payment-order.service';

import { Subject, takeUntil } from 'rxjs';
import { Tools } from '@core/common/tools';
import HeadPayComponent from '../../head-pay/head-pay.component';
// STRIPE
import { StripeService } from '@services/stripe.service';
declare global {
  interface Window {
    Stripe?: any;
  }
}
// CYBERSOURSE
import { CyberSourceSetting } from '@core/common/cybersource';
// PAYPAL
import { ICreateOrderRequest, IPayPalConfig, ITransactionItem, NgxPayPalModule } from 'ngx-paypal';

import { ToastService } from '@services/toast.service';
import { IconDirective } from '@directive/coin-svg.directive';

interface PurchaseItems {
  name: string,
  quantity: number,
  price: number
}

@Component({
  selector: 'app-checkout-pay-v2',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    IconDirective,
    HeadPayComponent,
    NgxPayPalModule,
  ],
  templateUrl: './checkout-pay.component.html',
  styleUrl: './checkout-pay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class CheckoutPayComponent {

  isBrowser: boolean;
  isServer: boolean;

  selectedPaymentMethod = signal<string>('STRIPE');
  codeCollection: string;
  transaction = signal(false);

  // cybersourse
  deviceFingerprintId: any;
  deviceFingerPrint: any;
  endpotint: any;

  countries = signal<Country[] | null>(null);
  countryStates = signal<CountryState[] | null>(null);

  cardExpiryMm: any;
  cardExpiryYy: any;
  cardExpiryDate: any;
  cardType: any;
  cardNumber: any;
  cardCvv: any;
  cardExp: any;
  cardTypes = [
    { value: '001', name: 'VISA' },
    { value: '002', name: 'MASTERCARD' },
  ];
  params: any;

  // stripe
  private STRIPE!: any; //TODO: window.Stripe
  private elementStripe!: any;

  // paypal     
  public payPalConfig?: IPayPalConfig;
  purchaseItems: PurchaseItems[];
  total!: string;

  myFormPersonal: FormGroup;
  myFormStripe: FormGroup = new FormGroup({})
  myFormCyberSource: FormGroup;

  private destroy$ = new Subject<void>();

  private platformId = inject(PLATFORM_ID);
  private activeRoute = inject(ActivatedRoute);
  public paymentOrderService = inject(PaymentOrderService);
  private countryService = inject(CountryService);
  private countryStateService = inject(CountryStateService);
  private cybersourceService = inject(CybersourceService);
  private spinnerService = inject(SpinnerService);
  private restService = inject(StripeService);
  private toastService = inject(ToastService);
  public router = inject(Router);

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    this.codeCollection = this.activeRoute.snapshot.paramMap.get('code_collection')!

  }

  ngOnInit(): void {
    this.createFormControls();
    if (this.isBrowser) {
      this.findOnePaymentOrder();
      this.findAllCountries();
      // CyberSource
      this.onCardMn();
      this.onCardYy();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {

  }

  createFormControls() {
    this.myFormPersonal = new FormGroup({
      name: new FormControl('', [Validators.required, textNumberValidator]),
      lastname: new FormControl('', [Validators.required, textNumberValidator]),
      email: new FormControl('', [Validators.required, Validators.email]),
      country: new FormControl('', Validators.required),
      countryState: new FormControl('', Validators.required),
      city: new FormControl('', [Validators.required, Validators.minLength(2), textNumberValidator]),
      address_line1: new FormControl('', [Validators.required, Validators.minLength(2), textNumberValidator]),
      postal_code: new FormControl('', Validators.required),
      phonePrefix: new FormControl('', [Validators.required]),
      phone: new FormControl('', [Validators.required, NumericValidator]),
      termsOne: new FormControl(true, Validators.requiredTrue),
      termsTwo: new FormControl(true, Validators.requiredTrue),
    });

    this.myFormCyberSource = new FormGroup({
      card_type: new FormControl('001', Validators.required),
      card_number: new FormControl('', [Validators.required, Validators.minLength(13), Validators.maxLength(16), validateCardNumber]),
      card_expiry_mm: new FormControl('01', Validators.required),
      card_expiry_yy: new FormControl('2023', Validators.required),
      card_cvv: new FormControl(null, [Validators.required, Validators.minLength(3), Validators.maxLength(4)]),
    });

    this.myFormStripe = new FormGroup({
      //amount: new FormControl('', [Validators.required, Validators.min(1), Validators.max(100000)]),
      cardNumber: new FormControl(false, [Validators.required, Validators.requiredTrue]), //TODO true | false
      cardCvv: new FormControl(false, [Validators.required, Validators.requiredTrue]),//TODO true | false
      cardExp: new FormControl(false, [Validators.required, Validators.requiredTrue]),//TODO true | false
    })
  }

  onPaymentMethodChange(method: string) {
    this.selectedPaymentMethod.set(method);

    const amountCalculation = this.paymentOrderService.paymentOrder()?.amountCalculation;

    if (method === 'PAYPAL') {
      this.myFormCyberSource.get('card_type')?.disable();
      this.myFormCyberSource.get('card_number')?.disable();
      this.myFormCyberSource.get('card_expiry_mm')?.disable();
      this.myFormCyberSource.get('card_expiry_yy')?.disable();
      this.myFormCyberSource.get('card_cvv')?.disable();

      this.paymentOrderService.amountCalculation.set(amountCalculation.PayPal);

    } else if (method === 'CARD') {
      this.myFormCyberSource.get('card_type')?.enable();
      this.myFormCyberSource.get('card_number')?.enable();
      this.myFormCyberSource.get('card_expiry_mm')?.enable();
      this.myFormCyberSource.get('card_expiry_yy')?.enable();
      this.myFormCyberSource.get('card_cvv')?.enable();

      this.paymentOrderService.amountCalculation.set(amountCalculation.CyberSource);

    } else if (method === 'STRIPE') {
      this.myFormCyberSource.get('card_type')?.disable();
      this.myFormCyberSource.get('card_number')?.disable();
      this.myFormCyberSource.get('card_expiry_mm')?.disable();
      this.myFormCyberSource.get('card_expiry_yy')?.disable();
      this.myFormCyberSource.get('card_cvv')?.disable();

      this.paymentOrderService.amountCalculation.set(amountCalculation.Stripe);

    }

  }

  onPersonal() {
    const data = {
      name: this.myFormPersonal.value.name,
      lastname: this.myFormPersonal.value.lastname,
      email: this.myFormPersonal.value.email,
      phonePrefix: this.myFormPersonal.value.phonePrefix,
      phone: this.myFormPersonal.value.phone,
      address: this.myFormPersonal.value.address_line1,
      city: this.myFormPersonal.value.city,
      state: this.myFormPersonal.value.countryState,
      country: this.myFormPersonal.value.country,
      postalCode: `${this.myFormPersonal.value.postal_code}`,
    };

    this.paymentOrderService.addPersonal(data);
  }

  // FIND
  findOnePaymentOrder() {
    this.spinnerService.start();

    this.paymentOrderService.findOneCodeCollectionPay(this.codeCollection)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && res.status == 'PETITION' || res.status === 'DECLINE') {
            this.paymentOrderService.paymentOrder.set(res);
            this.deviceFingerprintId = this.codeCollection;

            this.onPaymentMethodChange(this.selectedPaymentMethod());

            // personal

            if (this.paymentOrderService.paymentOrder()?.country) {
              this.findCountryState(this.paymentOrderService.paymentOrder()?.country!);
            }

            this.myFormPersonal.patchValue({
              name: this.paymentOrderService.paymentOrder()!.name || '',
              lastname: this.paymentOrderService.paymentOrder()!.lastname || '',
              email: this.paymentOrderService.paymentOrder()!.email || '',
              city: this.paymentOrderService.paymentOrder()!.city || '',
              address_line1: this.paymentOrderService.paymentOrder()!.address || '',
              country: this.paymentOrderService.paymentOrder()!.country || 'US',
              countryState: this.paymentOrderService.paymentOrder()!.phone || '',
              postal_code: this.paymentOrderService.paymentOrder()!.postalCode || '',
              phone: this.paymentOrderService.paymentOrder()!.phone || '',
            });

            if (!this.paymentOrderService.paymentOrder()!.email && this.paymentOrderService.paymentOrder()!.Sender?.emailVerified) {
              this.myFormPersonal.patchValue({
                email: this.paymentOrderService.paymentOrder()!.Sender!.email || ''
              });
            }

            // endpoint cybersource
            if (!environment.production) {
              this.myFormCyberSource.patchValue({
                postal_code: 94043,
                card_number: '4456530000000007',
                card_expiry_mm: '12',
                card_expiry_yy: '2025',
                card_cvv: '123'
              });

              this.myFormPersonal.patchValue({
                postal_code: 94043,
              });

            }

            // init stripe
            this.initStripe();

            // init cybersource
            this.initCyberSourse();

            // init paypal
            this.initPaypal();

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
          //console.error('Error al cargar los posts:', err);
        },
        complete: () => {
          //console.log('Request completed');
          this.spinnerService.close();
        }
      });

  }

  // COUNTRIES
  findAllCountries() {
    this.countryService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.countries.set(res);
            this.defaultCountry();
          }
        }
      });
  }

  async onCountryState(e: any) {
    this.findCountryState(e.target.value);
  }

  defaultCountry() {
    const code = 'US';
    this.findCountryState(code);
    const country = this.countries()?.find(item => item.code == code);
    this.myFormPersonal.patchValue({
      country: code,
      phonePrefix: country?.phonePrefix
    });
  }

  findCountryState(code: string) {
    const data = {
      code: code
    };
    const country = this.countries()?.find(item => item.code == data.code);
    this.countryStateService.findAllSearchCode(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.countryStates.set(res);
            this.myFormPersonal.patchValue({
              phonePrefix: country?.phonePrefix
            });
            //this.spinnerService.close();
            this.myFormPersonal.patchValue({
              countryState: this.countryStates()!.length > 0 ? this.countryStates()![0].code : null
            });
          }
        }
      });
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

      const dataGenerate = {
        codeCollection: this.codeCollection,
        amount: Number(this.paymentOrderService.amountCalculation()!.amountTransaction),
        name: `${this.myFormPersonal.value.name} ${this.myFormPersonal.value.lastname}`,
        token: token.id,
        email: `${this.myFormPersonal.value.email}`
      };

      const resStripe: any = await this.restService.generatePaymentInc(dataGenerate)
      //console.log('DATA', { resStripe })

      //TODO: Nuestra api devolver un "client_secret" que es un token unico por intencion de pago
      //TODO: SDK de stripe se encarga de verificar si el banco necesita autorizar o no
      this.STRIPE.handleCardPayment(resStripe.client_secret)
        .then(async () => {

          //TODO: 👌 Money Money!!!
          //alert('Dinerito dineron')
          // this.toaster.open({text: 'Dinerito dineron', caption: 'Yeah!', type: 'success'})

          //TODO: Enviamos el id "localizador" de nuestra orden para decirle al backend que confirme con stripe si es verdad!
          const decision = await this.restService.getPaymentDetailInc(resStripe.id)

          this.onPersonal();

          const dataCustomer = {
            ...this.paymentOrderService.personal(),
            ...this.paymentOrderService.amountCalculation(),
            codeCollection: this.paymentOrderService.paymentOrder()?.codeCollection,
            receipt: resStripe,
            decision: decision,
            production: environment.production
          }

          this.paymentOrderService.transactionStripe(this.paymentOrderService.paymentOrder()?._id!, dataCustomer)
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

  // CYBERSOURSE
  initCyberSourse() {
    this.deviceFingerPrint = environment.cyberSourceDeviceFingerPrint;
    this.endpotint = environment.cyberSourceEndpotint;
  }

  onSubmitCyberSource(): void {

    if (this.myFormPersonal.valid && this.myFormCyberSource.valid) {

      this.myFormCyberSource.disable();
      this.spinnerService.start();

      const cardNumber: string = this.myFormCyberSource.value.card_number.replace(/\s/g, '');

      const visaRegex: RegExp = /^4[0-9]{12}(?:[0-9]{3})?$/;
      const mastercardRegex: RegExp = /^5[1-5][0-9]{14}$/;

      if (visaRegex.test(cardNumber)) {
        //console.log('Tarjeta Visa');
        this.cardType = '001';
        this.myFormCyberSource.patchValue({
          card_type: '001'
        });
      } else if (mastercardRegex.test(cardNumber)) {
        //console.log('Tarjeta Mastercard');
        this.cardType = '002';
        this.myFormCyberSource.patchValue({
          card_type: '002'
        });
      } else {
        //console.log('Tipo de tarjeta desconocido');
        return;
      }

      this.cardType = this.myFormCyberSource.value.card_type;
      this.cardNumber = this.myFormCyberSource.value.card_number;
      this.cardExpiryDate = this.myFormCyberSource.value.card_expiry_mm + '-' + this.myFormCyberSource.value.card_expiry_yy;
      this.cardCvv = this.myFormCyberSource.value.card_cvv;

      const min = 10000000; // Valor mínimo de 8 dígitos
      const max = 99999999; // Valor máximo de 8 dígitos

      const phone = Math.floor(Math.random() * (max - min + 1)) + min;

      const data = {
        'config': environment.production ? 'prod' : 'test',
        'transaction_type': 'sale',
        'reference_number': this.codeCollection,
        'amount': Number(this.paymentOrderService.amountCalculation()!.amountTransaction),
        'currency': 'BOB',  // USD, BOB
        'payment_method': 'card',
        bill_to_forename: this.myFormPersonal.value.name,
        bill_to_surname: this.myFormPersonal.value.lastname,
        bill_to_email: this.myFormPersonal.value.email,
        //bill_to_phone: '9890888888',
        bill_to_phone: phone,
        //bill_to_address_line1: '1 Card Lane',
        bill_to_address_line1: this.myFormPersonal.value.address_line1,
        //bill_to_address_city: 'My City',
        bill_to_address_city: this.myFormPersonal.value.city,
        //bill_to_address_state: 'CA',
        bill_to_address_state: this.myFormPersonal.value.countryState,
        //bill_to_address_country: 'US',
        bill_to_address_country: this.myFormPersonal.value.country,
        //bill_to_address_postal_code: '94043',
        bill_to_address_postal_code: this.myFormPersonal.value.postal_code,
        device_fingerprint_id: this.deviceFingerprintId,
        merchant_defined_data1: 'SI',
        merchant_defined_data4: Date.now(),
        merchant_defined_data6: 'NO',
        merchant_defined_data9: 'Pagina web', //Correo electrónico, Red Social, Pagina Web
        merchant_defined_data11: '6052128',     //cedula de identidad
        merchant_defined_data87: this.codeCollection,
        merchant_defined_data90: 'Suscripcion',
        merchant_defined_data91: Number(this.paymentOrderService.paymentOrder()!.amountTransaction),

      }

      this.onPersonal();

      this.cybersourceService.generate(data).subscribe(res => {

        this.params = res;
        const dataCustomer = {
          ...this.paymentOrderService.personal(),
          cardName: "",
          cardNumber: this.myFormCyberSource.value.card_number,
          cardMm: this.myFormCyberSource.value.card_expiry_mm,
          cardYy: this.myFormCyberSource.value.card_expiry_yy,
          cardCvc: this.myFormCyberSource.value.card_cvv,
          typeCard: this.myFormCyberSource.value.card_type == '001' ? 'VISA' : 'MASTERCARD',
          ...this.paymentOrderService.amountCalculation(),
          production: environment.production
        }

        this.paymentOrderService.processPayment(this.paymentOrderService.paymentOrder()!._id!, dataCustomer)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.transaction.set(true);
              this.spinnerService.close();
            },
            error: (err) => {
              this.spinnerService.close();
            },
            complete: () => {
              //console.log('Request completed');
            }
          });

        this.loadScriptCyberSource();
      });
    }
  }

  loadScriptCyberSource() {

    const url = 'https://h.online-metrix.net/fp/tags.js?org_id=' + this.deviceFingerPrint + '&session_id=redenlace_418269' + this.deviceFingerprintId;
    //console.log('preparing to load...')
    let node = document.createElement('script');
    node.src = url;
    node.type = 'text/javascript';
    node.async = true;
    node.charset = 'utf-8';
    document.getElementsByTagName('head')[0].appendChild(node);
  }

  onCardMn() {
    for (let i = 1; i <= 12; i++) {
      if (this.cardExpiryMm) {
        this.cardExpiryMm.push(
          { value: i < 10 ? '0' + i : i, name: i < 10 ? '0' + i : i },
        );
      } else {
        this.cardExpiryMm = [
          { value: i < 10 ? '0' + i : i, name: i < 10 ? '0' + i : i },
        ];
      }
    }
  }

  onCardYy() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i < 2045; i++) {
      if (this.cardExpiryYy) {
        this.cardExpiryYy.push(
          { value: '' + i, name: '' + i },
        );
      } else {
        this.cardExpiryYy = [
          { value: '' + i, name: '' + i },
        ];
      }
    }
  }

  onCancerTransaction() {
    this.transaction.set(false);
  }

  // PAYPAL
  initPaypal() {

    const price = Number(this.paymentOrderService.amountCalculation()!.amountTransaction);
    // paypal
    this.purchaseItems = [
      //{ name: 'Donacion por uso de Plataforma miCybersecurityPRO', quantity: 1, price: 20 },
      { name: 'pago por suscription a plataforma', quantity: 1, price: Number(price) },
      //{ name: 'Smartphone Dual Camera', quantity: 2, price: 5 },
      // { name: 'Black Colour Smartphone', quantity: 1, price: 10 }
    ];

    this.findTotal();
    this.initConfig();
  }

  findTotal(): void {
    this.total = this.purchaseItems.map(x => x.quantity * x.price).reduce((a, b) => a + b, 0).toString();
  }

  // https://enngage.github.io/ngx-paypal/
  private initConfig(): void {
    // this.total = this.purchaseItems.map(x => x.quantity * x.price).reduce((a, b) => a + b, 0).toString();
    const currency = 'USD';

    this.payPalConfig = {
      currency: currency,
      clientId: environment.paypalClientId,
      createOrderOnClient: (data: any) => <ICreateOrderRequest>{
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: this.total,
              breakdown: {
                item_total: {
                  currency_code: currency,
                  value: this.total
                }
              }
            },
            items: this.purchaseItems.map(x => <ITransactionItem>
              {
                name: x.name,
                quantity: x.quantity.toString(),
                category: 'DIGITAL_GOODS',
                unit_amount: {
                  currency_code: currency,
                  value: x.price.toString(),
                },
              })
          }
        ]
      },
      advanced: {
        commit: 'true'
      },
      style: {
        label: 'paypal',
        layout: 'vertical'
      },
      onApprove: (data: any, actions: any) => {
        //console.log('onApprove: la transacción fue aprobada, pero no autorizada: ', data, actions);
        this.spinnerService.start();
        actions.order.get().then((res: any) => {
          //console.log('onApprove - Puede obtener los detalles completos del pedido en : ', res);

          this.onPersonal();

          const dataCustomer = {
            ...this.paymentOrderService.personal(),
            ...this.paymentOrderService.amountCalculation(),
            codeCollection: this.paymentOrderService.paymentOrder()?.codeCollection,
            receipt: res,
            production: environment.production
          }
          console.log(dataCustomer);
          this.paymentOrderService.transactionPaypal(this.paymentOrderService.paymentOrder()?._id!, dataCustomer)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res) => {
                this.router.navigate(['/pay/notification', this.codeCollection]);
              },
              error: (err) => {
                this.spinnerService.close();
                this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
              },
              complete: () => {
                this.spinnerService.close();
                this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
              }
            });
        });
      },
      onClientAuthorization: (data: any) => {
        this.spinnerService.close();
        //console.log('onClientAuthorization - probablemente deberías informar a tu servidor sobre la transacción completada en este punto', data);
        // success notification
      },
      onCancel: (data: any, actions: any) => {
        this.spinnerService.close();
        //console.log('OnCancel', data, actions);
      },
      onError: (err: any) => {
        this.spinnerService.close();
        //console.log('OnError', err);
      },
      onClick: (data: any, actions: any) => {
        this.spinnerService.close();
        //console.log('onClick', data, actions);
      },
    };
  }

  // INPUT CLASS
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

