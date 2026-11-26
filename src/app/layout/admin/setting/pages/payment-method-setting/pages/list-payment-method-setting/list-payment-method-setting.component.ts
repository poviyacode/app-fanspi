import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PaymentMethod } from '@interfaces/paymentMethod';
import { PaymentMethodService } from '@services/payment-method.service';
import { SpinnerService } from '@services/spinner.service';
import { ToastService } from '@services/toast.service';
import { AuthService } from '@services/auth.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { UIStyles } from '@core/common/uistyles';
import { DialogService } from '@services/dialog.service';
import UniversalPaymentMethodSettingComponent from '../universal-payment-method-setting/universal-payment-method-setting.component';
import { PaymentMethodCategoryService } from '@services/payment-method-category.service';
import { Subject, takeUntil } from 'rxjs';
import { PaymentMethodCategory } from '@interfaces/paymentMethodCategory';

@Component({
  selector: 'app-list-payment-method-setting',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    IconDirective,
    UniversalPaymentMethodSettingComponent,
  ],
  templateUrl: './list-payment-method-setting.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './list-payment-method-setting.component.scss',
})
export default class ListPaymentMethodSettingComponent {

  public className = UIStyles;

  //data = signal<{ paymentMethodCategory: PaymentMethodCategory | null; paymentMethod: PaymentMethod | null } | null>(null);
  data = signal<PaymentMethod | null>(null);
  selectedMethod = signal<string>('');
  private destroy$ = new Subject<void>();

  public paymentMethodService = inject(PaymentMethodService);
  public paymentMethodCategoryService = inject(PaymentMethodCategoryService);
  private spinnerService = inject(SpinnerService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  public dialogService = inject(DialogService);

  ngOnInit(): void {
    this.findAllUser();
  }

  findAllUser(): void {
    const data = { userId: this.authService.user()?._id };
    this.paymentMethodService.findAllUser(data).subscribe(res => {
      if (res) {
        this.paymentMethodService.resetPaymentMethods();
        this.paymentMethodService.addPaymentMethods(res.paymentMethods!);
      }
    });
  }

  // categories
  async findAllPaymentMethodCategories(): Promise<void> {
    const data = {
      operationType: ["WITHDRAW"],
      status: 'ACTIVE'
    };
    this.paymentMethodCategoryService.findAll(data).
      pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res) {
          this.paymentMethodCategoryService.addPaymentMethodCategories(res.data!);
          this.dialogService.toggleModal('listPaymentMethodCategories');
        }
      });
  }

  // Verifica si el usuario ya tiene configurado este método
  isMethodConfigured(code: string): boolean {
    return this.paymentMethodService.paymentMethods().some(t => t.type === code);
  }

  // Maneja la selección y la transición de modales
  onSelectCategory(item: PaymentMethodCategory) {
    this.selectedMethod.set(item.code!);
    this.data.set({ ...this.getMethodData(item.code!), PaymentMethodCategory: item });
    this.dialogService.closeModal();
    this.dialogService.toggleModal('formPaymentMethod');
  }

  async onAddMethod() {
    this.selectedMethod.set('');
    await this.findAllPaymentMethodCategories();
  }

  getMethodData(code: string) {
    return this.paymentMethodService.paymentMethods().find(t => t.type === code);
  }

  async onOpenMethodModal(item: PaymentMethod) {
    this.selectedMethod.set(item.type!);
    this.data.set(item);
    this.dialogService.toggleModal('formPaymentMethod');
  }

  onSaveMethod(detailsValues: any): void {
    this.spinnerService.start();
    this.dialogService.closeModal();

    const payload = detailsValues;
    this.paymentMethodService.create(payload).subscribe({
      next: (res) => {
        if (res) {
          const currentPaymentMethods = this.paymentMethodService.paymentMethods();

          // Verificamos si ya existe un elemento con el mismo _id
          const index = currentPaymentMethods.findIndex(item => item._id === res._id);

          let updatedPaymentMethods: PaymentMethod[];

          if (index !== -1) {
            // Si ya existe, reemplazamos el elemento existente para evitar duplicados
            updatedPaymentMethods = [...currentPaymentMethods];
            updatedPaymentMethods[index] = res;
          } else {
            // Si es nuevo, lo agregamos al arreglo
            updatedPaymentMethods = [...currentPaymentMethods, res];
          }

          this.paymentMethodService.addPaymentMethods(updatedPaymentMethods);
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        }
      },
      error: (err) => {
        this.spinnerService.close();
        this.toastService.start({ type: 'error', message: err?.error?.message || 'somethingWentWrong' });
      },
      complete: () => {
        this.spinnerService.close();
      }
    });
  }

  onDeleteMethod(detailsValues: any): void {
    this.spinnerService.start();
    this.dialogService.closeModal();
    const methodId = detailsValues?._id;

    this.paymentMethodService.delete(methodId!).subscribe({
      next: (res) => {
        if (res) {
          // Filtramos el estado actual para quitar el elemento eliminado
          const currentPaymentMethods = this.paymentMethodService.paymentMethods();
          const updatedPaymentMethods = currentPaymentMethods.filter(item => item._id !== methodId);

          // Actualizamos la señal con el nuevo arreglo sin el elemento borrado
          this.paymentMethodService.addPaymentMethods(updatedPaymentMethods);

          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        }
      },
      error: (err) => {
        this.spinnerService.close();
        this.toastService.start({ type: 'error', message: err?.error?.message || 'somethingWentWrong' });
      },
      complete: () => {
        this.spinnerService.close();
      }
    });
  }

  onCloseModal() {
    this.dialogService.closeModal();
  }
}