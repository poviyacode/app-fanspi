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
import { QrAtcService } from '@services/qr-atc.service';

interface PurchaseItems {
  name: string,
  quantity: number,
  price: number
}

@Component({
  selector: 'app-qr-atc-pay',
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
  templateUrl: './qr-atc-pay.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './qr-atc-pay.component.scss'
})
export default class QrAtcPayComponent {

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
  private qrAtcService = inject(QrAtcService);

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.codeCollection = this.activeRoute.snapshot.paramMap.get('code_collection')!;
  }

  ngOnInit(): void {
    this.createFormControls();
    if (this.isBrowser) {
      this.generateQr();
      this.editPersonal();
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


    if (!environment.production) {
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

  // generate qr
  generateQr() {

    const amountInCents = Number(this.paymentOrderService.amountCalculation()!.amountTransaction).toFixed(2);

    const data = {
      referenceNumber: Date.now,
      amount: amountInCents,
      purchaseDetails: ""
    }

    this.qrAtcService.generateQr(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.transaction.set(true);
          }
        }
      });
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

