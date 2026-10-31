import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, OnInit, Output, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NumericValidator, textNumberValidator, validateCardNumber, validateExpiryDate } from '@core/common/custom-validators.ts';
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

    this.myFormCyberSource = new FormGroup({
      card_type: new FormControl('001',
        Validators.required),
      card_number: new FormControl('', [
        Validators.required, Validators.minLength(15),
        Validators.maxLength(19), validateCardNumber
      ]),
      card_expiry: new FormControl('', [
        Validators.required,
        validateExpiryDate()
      ]),
      //card_expiry_mm: new FormControl('01', Validators.required),
      //card_expiry_yy: new FormControl(currentYear, Validators.required),
      card_cvv: new FormControl(null, [Validators.required, Validators.minLength(3), Validators.maxLength(4)]),
    });

    const paymentOrderPay = this.paymentOrderService.paymentOrderPay()!;

    if (!paymentOrderPay.production) {
      this.myFormCyberSource.patchValue({
        //postal_code: 94043,
        card_number: '4242 4242 4242 4242',
        card_expiry: '12 / 28',
        //card_expiry_mm: '12',
        //card_expiry_yy: '2028',
        card_cvv: '123'
      });

    }
  }

  onCardNumberInput(event: any): void {
    const input = event.target;
    // 1. Obtener solo los números eliminando espacios previos o letras
    let trimmed = input.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');

    // 2. Dividir el texto en bloques de 4 dígitos usando Regex
    let numbers: string[] = [];
    for (let i = 0; i < trimmed.length; i += 4) {
      numbers.push(trimmed.substr(i, 4));
    }

    // 3. Unirlos con un espacio flojo
    const formattedValue = numbers.join(' ');

    // 4. Actualizar el valor visual en el input e informar al Reactive Form
    input.value = formattedValue;
    this.myFormCyberSource.get('card_number')?.setValue(formattedValue, { emitEvent: false });
  }

  formatExpiryDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length === 1 && parseInt(value) > 1) {
      value = '0' + value;
    }

    if (value.length >= 2) {
      const month = parseInt(value.substring(0, 2));
      if (month > 12) value = '12' + value.substring(2);
      if (month === 0) value = '01' + value.substring(2);
    }

    if (value.length > 2) {
      input.value = `${value.substring(0, 2)} / ${value.substring(2, 4)}`;
    } else {
      input.value = value;
    }

    this.myFormCyberSource.get('card_expiry')?.setValue(input.value, { emitEvent: false });
  }

  // CYBERSOURSE
  initCyberSourse() {
    this.deviceFingerPrint = environment.cyberSourceDeviceFingerPrint;
    this.endpotint = environment.cyberSourceEndpotint;
  }

  onSubmitCyberSource(): void {

    if (this.myFormCyberSource.valid) {

      this.spinnerService.start();
      this.myFormCyberSource.disable();

      const paymentOrderId = this.paymentOrderService.paymentOrderPay()!._id!
      const partialAmount = Number(this.paymentOrderService.payWithOrder()!.partialAmount);
      const currency = this.paymentOrderService.payWithOrder()?.Money?.iso;

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

      const expiryValue = this.myFormCyberSource.get('card_expiry')?.value;
      let card_expiry_mm = '';
      let card_expiry_yy = '';

      if (expiryValue) {
        // Separamos por el delimitador ' / '
        const [month, year] = expiryValue.split(' / ');
        card_expiry_mm = month;
        card_expiry_yy = year && year.length === 2 ? `20${year}` : year;;
      }

      this.cardType = this.myFormCyberSource.value.card_type;
      this.cardNumber = this.myFormCyberSource.value.card_number.replace(/\s+/g, '');
      this.cardExpiryDate = card_expiry_mm + '-' + card_expiry_yy;
      this.cardCvv = this.myFormCyberSource.value.card_cvv;

      const data = {
        paymentOrderId: paymentOrderId,
        amount: Number(partialAmount),
        currency: currency,
        deviceFingerprintId: this.deviceFingerPrint,
        card: {
          cardName: "CARD CYBERSOURCE",
          cardNumber: this.myFormCyberSource.value.card_number.replace(/\s+/g, ''),
          cardMm: card_expiry_mm,
          cardYy: `${card_expiry_yy}`,
          cardCvc: this.myFormCyberSource.value.card_cvv,
          type: this.myFormCyberSource.value.card_type == '001' ? 'VISA' : 'MASTERCARD',
        }
      };

      console.log(data)

      this.cybersourceService.generate(data)
        .subscribe({
          next: (res: any) => {

            this.params = res;
            this.transaction.set(true);
          },
          error: (err) => {
            this.spinnerService.close();
            this.myFormCyberSource.enable();
          },
          complete: () => {
            this.spinnerService.close();
            this.myFormCyberSource.enable();
          }
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

  onCancelTransaction(): void {
    const paymentOrder = this.paymentOrderService.paymentOrderPay();

    if (paymentOrder?.status === 'DECLINE' || paymentOrder?.status === 'PETITION') {
      this.router.navigate(['/pay/personal', this.codeCollection]);
    } else {
      let url = '';
      url = this.paymentOrderService.paymentOrderPay()?.gatewayDetails.urlReturn + '/' + this.codeCollection;
      const link = document.createElement('a');
      link.href = url;
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
    }

  }

  onCloseModal() {
    this.closeModal.emit(); // Notifica al padre que el modal se cerró
  }

  // INPUT CLASS
  cardClass() {
    return Tools.cardClass();
  }

  buttonPrimaryClass() {
    return Tools.buttonPrimaryClass();
  }

  buttonSecondaryClass() {
    return Tools.buttonSecondaryClass();
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
