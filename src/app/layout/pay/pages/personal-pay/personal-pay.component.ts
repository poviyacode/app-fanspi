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
import HeadPayComponent from '../head-pay/head-pay.component';
import { DialogService } from '@services/dialog.service';

@Component({
  selector: 'app-personal-pay',
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
  templateUrl: './personal-pay.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './personal-pay.component.scss'
})
export default class PersonalPayComponent {

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
  private spinnerService = inject(SpinnerService);
  private toastService = inject(ToastService);
  public router = inject(Router);
  private userService = inject(UserService);
  public dialogService = inject(DialogService);

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.codeCollection = this.activeRoute.snapshot.paramMap.get('code_collection')!;
  }

  ngOnInit(): void {
    this.createFormControls();
    if (this.isBrowser) {
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
    const personal = this.userService.personal()!;
    const paymentOrderPay = this.paymentOrderService.paymentOrderPay()!;
    this.countries.set(paymentOrderPay.Countries!);
    this.countryStates.set(paymentOrderPay.CountryStates!);

    const countryState = this.countryStates()?.find(item => item._id == paymentOrderPay?.User?.CountryState?._id);

    // personal
    this.myFormPersonal.patchValue({
      name: personal?.name || '',
      lastname: personal?.lastname || '',
      email: personal?.email || '',
      city: personal?.city || '',
      address_line1: personal?.address || '',
      country: personal?.Country?._id || 'US',
      countryState: countryState?._id || this.countryStates()![0]._id,
      postal_code: personal?.postalCode || '',
      phonePrefix: personal?.phonePrefix || personal?.Country?.phonePrefix,
      phone: personal?.phone || '',
    });

    this.verifiedPersonal();

  }

  verifiedPersonal() {

    const { name, lastname, email, phonePrefix, phone, address, city, Country, CountryState, postalCode } =
      this.paymentOrderService.paymentOrderPay()?.User || {};

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
      if (this.paymentOrderService.paymentOrderPay()?.User!) {
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

            if (this.paymentOrderService.paymentOrderPay()?.User?.Country) {
              const countryId = this.paymentOrderService.paymentOrderPay()?.User?.Country!.toString()!;
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

  onSubmit() {

    this.onCancelPersonalPay();

    const formValues = this.myFormPersonal.getRawValue();

    const data = {
      name: formValues.name,
      lastname: formValues.lastname,
      email: formValues.email,
      phonePrefix: formValues.phonePrefix,
      phone: formValues.phone,
      address: formValues.address_line1,
      city: formValues.city,
      CountryState: formValues.countryState,
      Country: formValues.country,
      postalCode: `${formValues.postal_code}`,
    };

    this.userService.addPersonal(data);
    const userId = this.paymentOrderService.paymentOrderPay()?.User?._id;

    this.spinnerService.start();

    this.userService.update(userId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.userService.addPersonal(res);
            this.isVerifiedPersonal.set(true);
            this.editPersonal();
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        }
      });
  }

  onCancelPersonalPay(): void {
    this.closeModal.emit();
  }

  get formattedPartialAmount(): number {
    const remainingAmount = this.paymentOrderService.paymentOrderPay()?.remainingAmount || 0;
    // Eliminamos cualquier carácter que no sea número o punto, y convertimos a número
    const cleanValue = String(remainingAmount).replace(/[^0-9.]/g, '');
    return parseFloat(cleanValue) || 0;
  }

  // Obtiene el último intento de pago fallido
  getLastInstallmentError(): any | null {
    const order = this.paymentOrderService.paymentOrderPay();
    if (order?.installments && order.installments.length > 0) {
      const last = order.installments[order.installments.length - 1];
      if (last?.status === 'DECLINE') {
        return last;
      }
    }
    return null;
  }

  // Extrae de manera segura el mensaje de error sin importar de dónde venga
  get currentOrder() {
    return this.paymentOrderService.paymentOrderPay();
  }
  getErrorMessage(): string | null {
    return this.paymentOrderService.getErrorMessage(this.currentOrder);
  }


  // INPUT CLASS
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
