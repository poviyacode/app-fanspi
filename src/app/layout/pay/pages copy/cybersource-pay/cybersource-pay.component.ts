import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
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

@Component({
  selector: 'app-cybersource-pay',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    IconDirective,
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
  templateUrl: './cybersource-pay.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './cybersource-pay.component.scss'
})
export default class CybersourcePayComponent {

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

  // cybersourse
  deviceFingerprintId: any;
  deviceFingerPrint: any;
  endpotint: any;

  myFormCyberSource: FormGroup;

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
      this.initCyberSourse();
      this.editPersonal();

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

    const currentYear = new Date().getFullYear();

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
    });

    this.myFormCyberSource = new FormGroup({
      card_type: new FormControl('001', Validators.required),
      card_number: new FormControl('', [Validators.required, Validators.minLength(13), Validators.maxLength(16), validateCardNumber]),
      card_expiry_mm: new FormControl('01', Validators.required),
      card_expiry_yy: new FormControl(currentYear, Validators.required),
      card_cvv: new FormControl(null, [Validators.required, Validators.minLength(3), Validators.maxLength(4)]),
    });

    if (!environment.production) {
      this.myFormCyberSource.patchValue({
        postal_code: 94043,
        card_number: '4242424242424242',
        card_expiry_mm: '12',
        card_expiry_yy: '2028',
        card_cvv: '123'
      });

      this.myFormPersonal.patchValue({
        postal_code: 94043,
      });

    }
  }

  editPersonal() {
    const res = this.paymentOrderService.paymentOrderPay()!;
    this.countries.set(res.Countries!);
    this.countryStates.set(res.CountryStates!);

    const countryState = this.countryStates()?.find(item => item._id == res?.Sender?.CountryState?._id);

    // personal
    this.myFormPersonal.patchValue({
      name: res?.Sender?.name || '',
      lastname: res?.Sender?.lastname || '',
      email: res?.Sender?.email || '',
      city: res?.Sender?.city || '',
      address_line1: res?.Sender?.address || '',
      country: res?.Sender?.Country?._id || 'US',
      countryState: countryState?._id || this.countryStates()![0]._id,
      postal_code: res?.Sender?.postalCode || '',
      phonePrefix: res?.Sender?.phonePrefix || res?.Sender?.Country?.phonePrefix,
      phone: res?.Sender?.phone || '',
    });

    this.verifiedPersonal();

  }

  onAddPersonal() {
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

    this.userService.addPersonal(data);
  }

  verifiedPersonal() {

    const { name, lastname, email, phonePrefix, phone, address, city, Country, CountryState, postalCode } =
      this.paymentOrderService.paymentOrderPay()?.Sender || {};
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
      if (this.paymentOrderService.paymentOrderPay()?.Sender!) {
        this.isVerifiedPersonal.set(true);
      }
    }
  }

  // COUNTRIES
  findAllCountries() {
    this.countryService.findAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.countries.set(res);

            if (this.paymentOrderService.paymentOrder()?.Sender?.Country) {
              const countryId = this.paymentOrderService.paymentOrder()?.Sender?.Country!.toString()!;
              this.findCountryState(countryId);
            } else {
              //this.defaultCountry();
            }

          }
        }
      });
  }

  async onCountryState(e: any) {
    this.findCountryState(e.target.value);
  }

  findCountryState(countryId: string) {
    const data = {
      Country: countryId
    };
    const country = this.countries()?.find(item => item._id == countryId);

    this.countryStateService.findAllCountry(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.countryStates.set(res);
            this.myFormPersonal.patchValue({
              phonePrefix: country?.phonePrefix,
              countryState: this.countryStates()!.length > 0 ? this.countryStates()![0].code : null
            });
          }
        }
      });
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

      const country = this.countries()?.find(item => item._id === this.myFormPersonal.value.country);
      const countryState = this.countryStates()?.find(item => item._id === this.myFormPersonal.value.countryState);
      this.deviceFingerprintId = this.codeCollection;
      const amountInCents = Number(this.paymentOrderService.amountCalculation()!.amountTransaction).toFixed(2);

      const data = {
        'config': environment.production ? 'prod' : 'test',
        'transaction_type': 'sale',
        'reference_number': this.codeCollection,
        'amount': Number(amountInCents),
        'currency': 'BOB',  // USD, BOB
        'payment_method': 'card',
        bill_to_forename: this.myFormPersonal.value.name,
        bill_to_surname: this.myFormPersonal.value.lastname,
        bill_to_email: this.myFormPersonal.value.email,
        //bill_to_phone: '9890888888',
        bill_to_phone: `${phone}`,
        //bill_to_address_line1: '1 Card Lane',
        bill_to_address_line1: this.myFormPersonal.value.address_line1,
        //bill_to_address_city: 'My City',
        bill_to_address_city: this.myFormPersonal.value.city,
        //bill_to_address_state: 'CA',
        bill_to_address_state: countryState?.code,
        //bill_to_address_country: 'US',
        bill_to_address_country: country?.code,
        //bill_to_address_postal_code: '94043',
        bill_to_address_postal_code: this.myFormPersonal.value.postal_code,
        device_fingerprint_id: this.deviceFingerprintId,
        merchant_defined_data1: 'SI',
        merchant_defined_data4: Date.now(),
        merchant_defined_data6: 'NO',
        merchant_defined_data9: 'Pagina web', //Correo electrónico, Red Social, Pagina Web
        merchant_defined_data11: '6052128',     //cedula de identidad
        merchant_defined_data87: this.codeCollection,
        merchant_defined_data90: 'Subscripcion',
        merchant_defined_data91: Number(amountInCents),
      }

      this.onAddPersonal();

      this.cybersourceService.generate(data).subscribe(res => {

        this.params = res;
        const dataCustomer = {
          ...this.userService.personal(),
          ...this.paymentOrderService.amountCalculation(),
          cardName: "",
          cardNumber: this.myFormCyberSource.value.card_number,
          cardMm: this.myFormCyberSource.value.card_expiry_mm,
          cardYy: `${this.myFormCyberSource.value.card_expiry_yy}`,
          cardCvc: this.myFormCyberSource.value.card_cvv,
          typeCard: this.myFormCyberSource.value.card_type == '001' ? 'VISA' : 'MASTERCARD',
          production: environment.production
        }

        this.paymentOrderService.processPayment(this.paymentOrderService.paymentOrderPay()!._id!, dataCustomer)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.transaction.set(true);
              this.spinnerService.close();
            },
            error: (err) => {
              this.myFormCyberSource.enable();
              this.spinnerService.close();
            },
            complete: () => {
              this.myFormCyberSource.enable();
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

  onCancelTransaction(): void {
    let url = '';
    url = this.paymentOrderService.paymentOrderPay()?.paymentDetails.urlReturn + '/' + this.codeCollection;
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
