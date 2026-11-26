import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { validateCardNumber, validateExpiryDate } from '@core/common/custom-validators.ts';
import { environment } from '@environments/environment';
import { SpinnerService } from '@services/spinner.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { CybersourceService } from '@services/cybersource.service';
import { PaymentOrderService } from '@services/payment-order.service';
import { Subject } from 'rxjs';
import { UIStyles } from '@core/common/uistyles';
import { IconDirective } from '@directive/coin-svg.directive';

@Component({
  selector: 'app-cybersource-pay',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    IconDirective,
  ],
  templateUrl: './cybersource-pay.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './cybersource-pay.component.scss',
})
export default class CybersourcePayComponent implements OnInit, OnDestroy {
  public className = UIStyles;
  isBrowser: boolean;
  isServer: boolean;

  codeCollection: string;
  transaction = signal(false);

  // CyberSource
  deviceFingerprintId: any;
  deviceFingerPrint: any;
  endpoint: any;

  // Inicializado de forma síncrona para evitar que sea undefined en SSR
  myFormCyberSource: FormGroup = this.buildCyberSourceForm();

  cardExpiryMm: { value: string | number; name: string | number }[] = [];
  cardExpiryYy: { value: string; name: string }[] = [];
  cardExpiryDate: any;
  cardType: any;
  cardNumber: any;
  cardCvv: any;
  cardTypes = [
    { value: '001', name: 'VISA' },
    { value: '002', name: 'MASTERCARD' },
  ];
  params: any;

  readonly closeModal = output<void>();
  private destroy$ = new Subject<void>();

  @ViewChild('content', { static: true }) content!: ElementRef;
  capturedImage: string | null = null;

  private platformId = inject(PLATFORM_ID);
  private activeRoute = inject(ActivatedRoute);
  public paymentOrderService = inject(PaymentOrderService);
  private cybersourceService = inject(CybersourceService);
  private spinnerService = inject(SpinnerService);
  public router = inject(Router);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.codeCollection = this.activeRoute.snapshot.paramMap.get('code_collection') ?? '';
  }

  private buildCyberSourceForm(): FormGroup {
    return new FormGroup({
      card_type: new FormControl('001', Validators.required),
      card_number: new FormControl('', [
        Validators.required,
        Validators.minLength(15),
        Validators.maxLength(19),
        validateCardNumber,
      ]),
      card_expiry: new FormControl('', [
        Validators.required,
        validateExpiryDate(),
      ]),
      card_cvv: new FormControl(null, [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(4),
      ]),
    });
  }

  get cardExpiryControl(): FormControl {
    return this.myFormCyberSource.get('card_expiry') as FormControl;
  }

  get paramsDataEntries(): { key: string; value: unknown }[] {
    const data = this.params?.data;
    if (!data || typeof data !== 'object') {
      return [];
    }
    return Object.entries(data).map(([key, value]) => ({ key, value }));
  }

  ngOnInit(): void {
    this.applySandboxDefaults();

    if (this.isBrowser) {
      this.initCyberSource();
      this.onCardMn();
      this.onCardYy();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applySandboxDefaults(): void {
    // Evita fallos en SSR si paymentOrderPay() aún no está cargado
    const paymentOrderPay = this.paymentOrderService.paymentOrderPay();
    if (paymentOrderPay && !paymentOrderPay.production) {
      this.myFormCyberSource.patchValue({
        card_number: '4242 4242 4242 4242',
        card_expiry: '12 / 28',
        card_cvv: '123',
      });
    }
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Eliminar espacios previos o caracteres no numéricos
    const trimmed = input.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');

    // Dividir en bloques de 4 dígitos
    const numbers: string[] = [];
    for (let i = 0; i < trimmed.length; i += 4) {
      numbers.push(trimmed.substring(i, i + 4));
    }

    const formattedValue = numbers.join(' ');
    input.value = formattedValue;
    this.myFormCyberSource.get('card_number')?.setValue(formattedValue, { emitEvent: false });
  }

  formatExpiryDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length === 1 && parseInt(value, 10) > 1) {
      value = '0' + value;
    }

    if (value.length >= 2) {
      const month = parseInt(value.substring(0, 2), 10);
      if (month > 12) value = '12' + value.substring(2);
      if (month === 0) value = '01' + value.substring(2);
    }

    if (value.length > 2) {
      input.value = `${value.substring(0, 2)} / ${value.substring(2, 4)}`;
    } else {
      input.value = value;
    }

    this.cardExpiryControl.setValue(input.value, { emitEvent: false });
  }

  initCyberSource(): void {
    this.deviceFingerPrint = environment.cyberSourceDeviceFingerPrint;
    this.endpoint = environment.cyberSourceEndpotint;
  }

  onSubmitCyberSource(): void {
    if (!this.myFormCyberSource.valid) {
      return;
    }

    const paymentOrderPay = this.paymentOrderService.paymentOrderPay();
    const payWithOrder = this.paymentOrderService.payWithOrder();

    if (!paymentOrderPay?._id) {
      return;
    }

    this.spinnerService.start();
    this.myFormCyberSource.disable();

    const paymentOrderId = paymentOrderPay._id;
    const partialAmount = Number(payWithOrder?.partialAmount ?? 0);
    const currency = payWithOrder?.Money?.iso;

    const rawCardNumber: string = String(this.myFormCyberSource.value.card_number ?? '').replace(/\s/g, '');
    const visaRegex = /^4[0-9]{12}(?:[0-9]{3})?$/;
    const mastercardRegex = /^5[1-5][0-9]{14}$/;

    if (visaRegex.test(rawCardNumber)) {
      this.cardType = '001';
      this.myFormCyberSource.patchValue({ card_type: '001' });
    } else if (mastercardRegex.test(rawCardNumber)) {
      this.cardType = '002';
      this.myFormCyberSource.patchValue({ card_type: '002' });
    } else {
      this.spinnerService.close();
      this.myFormCyberSource.enable();
      return;
    }

    const expiryValue: string = this.cardExpiryControl.value ?? '';
    let cardExpiryMm = '';
    let cardExpiryYy = '';

    if (expiryValue) {
      const [month, year] = expiryValue.split(' / ');
      cardExpiryMm = month ?? '';
      cardExpiryYy = year && year.length === 2 ? `20${year}` : (year ?? '');
    }

    this.cardType = this.myFormCyberSource.value.card_type;
    this.cardNumber = rawCardNumber;
    this.cardExpiryDate = `${cardExpiryMm}-${cardExpiryYy}`;
    this.cardCvv = this.myFormCyberSource.value.card_cvv;

    const payload = {
      paymentOrderId,
      amount: Number(partialAmount),
      currency,
      deviceFingerprintId: this.deviceFingerPrint,
      card: {
        cardName: 'CARD CYBERSOURCE',
        cardNumber: rawCardNumber,
        cardMm: cardExpiryMm,
        cardYy: `${cardExpiryYy}`,
        cardCvc: this.myFormCyberSource.value.card_cvv,
        type: this.cardType === '001' ? 'VISA' : 'MASTERCARD',
      },
    };

    this.cybersourceService.generate(payload).subscribe({
      next: (res: any) => {
        this.params = res;
        this.transaction.set(true);
      },
      error: () => {
        this.spinnerService.close();
        this.myFormCyberSource.enable();
      },
      complete: () => {
        this.spinnerService.close();
        this.myFormCyberSource.enable();
      },
    });
  }

  onCardMn(): void {
    this.cardExpiryMm = [];
    for (let i = 1; i <= 12; i++) {
      const formatted = i < 10 ? `0${i}` : i;
      this.cardExpiryMm.push({ value: formatted, name: formatted });
    }
  }

  onCardYy(): void {
    const currentYear = new Date().getFullYear();
    this.cardExpiryYy = [];
    for (let i = currentYear; i < 2045; i++) {
      const yearStr = `${i}`;
      this.cardExpiryYy.push({ value: yearStr, name: yearStr });
    }
  }

  onCancelTransaction(): void {
    if (!this.isBrowser) {
      return;
    }

    const paymentOrder = this.paymentOrderService.paymentOrderPay();

    if (paymentOrder?.status === 'DECLINE' || paymentOrder?.status === 'PETITION') {
      this.router.navigate(['/pay/personal', this.codeCollection]);
    } else {
      const url = `${paymentOrder?.gatewayDetails?.urlReturn ?? ''}/${this.codeCollection}`;
      const link = document.createElement('a');
      link.href = url;
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
    }
  }

  onCloseModal(): void {
    this.closeModal.emit();
  }
}