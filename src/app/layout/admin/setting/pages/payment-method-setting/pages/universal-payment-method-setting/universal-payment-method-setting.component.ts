import { Component, EventEmitter, inject, Input, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UIStyles } from '@core/common/uistyles';
import { PaymentMethod } from '@interfaces/paymentMethod';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { CommonModule } from '@angular/common';
import { MethodUIConfig, PAYMENT_METHOD_CONFIGS } from '../payment-methods.config';
import { IconDirective } from '@directive/coin-svg.directive';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-universal-payment-method-setting',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IconDirective,
    CustomTranslatePipe
  ],
  templateUrl: './universal-payment-method-setting.component.html',
  styleUrl: './universal-payment-method-setting.component.scss',
})
export default class UniversalPaymentMethodSettingComponent {

  public className = UIStyles;

  @Input() methodType!: string;
  @Input() data?: PaymentMethod | null;
  @Output() save = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  public dialogService = inject(DialogService);
  public authService = inject(AuthService);

  myForm!: FormGroup;
  config?: MethodUIConfig;

  // ngOnChanges detecta cada vez que el valor de methodType o data cambia desde el padre
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['methodType'] || changes['data']) {
      this.buildForm();
    }
  }

  private buildForm(): void {
    if (!this.methodType) return;

    // 1. Obtener la configuración visual y de campos según el método de pago actual
    this.config = PAYMENT_METHOD_CONFIGS[this.methodType];

    if (this.config) {
      const formGroupConfig: Record<string, any> = {};

      // 2. Construir dinámicamente los controles del formulario y sus validadores
      this.config.fields.forEach(field => {
        // Intentamos extraer el valor inicial si existe en details
        const initialValue = this.data?.details?.[field.key as keyof typeof this.data.details] || '';
        formGroupConfig[field.key] = [initialValue, field.validators || []];
      });

      this.myForm = this.fb.group(formGroupConfig);
    }
  }

  onSubmit(): void {
    if (this.myForm.valid) {
      const payload = {
        paymentMethodCategoryId: this.data?.PaymentMethodCategory?._id,
        moneyIso: this.data?.PaymentMethodCategory?.Money?.iso,
        type: this.methodType,
        details: this.myForm.value,
        primary: false
      };
      this.save.emit(payload);
    }
  }

  onDelete() {
    const payload = {
      _id: this.data?._id,

    };
    this.delete.emit(payload);
  }

  onCloseModal() {
    this.dialogService.closeModal();
  }
}

