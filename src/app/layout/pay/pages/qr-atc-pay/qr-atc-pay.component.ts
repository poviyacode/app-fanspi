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
import { DomSanitizer } from '@angular/platform-browser';

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

  qrData = signal<any>(null);

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
  private sanitizer = inject(DomSanitizer);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.codeCollection = this.activeRoute.snapshot.paramMap.get('code_collection')!;
  }

  ngOnInit(): void {
    this.createFormControls();
    if (this.isBrowser) {
      this.generateQr();
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
  }

  // generate qr
  generateQr() {

    const amountInCents = Number(this.paymentOrderService.payWithOrder()!.partialAmount);
    const currency = this.paymentOrderService.payWithOrder()?.Money?.iso;
    const codeCollection = this.paymentOrderService.paymentOrderPay()?.codeCollection;

    const data = {
      codeCollection: codeCollection,
      amount: amountInCents,
      currency: currency,
      purchaseDetails: ""
    };

    this.qrAtcService.generateQr(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.qrData.set(res);
            this.transaction.set(true);
          }
        },
      });
  }

  getSafeQr(base64: string) {
    return this.sanitizer.bypassSecurityTrustUrl('data:image/png;base64,' + base64);
  }

  downloadQr() {
    const source = `data:image/png;base64,${this.qrData()?.imagen}`;
    const link = document.createElement("a");
    link.href = source;
    link.download = `QR_Pago_${this.qrData()?.numeroReferencia}.png`;
    link.click();
  }

  onCancerTransaction() {
    this.transaction.set(false);
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

