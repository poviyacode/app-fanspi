import { Component, computed, DestroyRef, EventEmitter, inject, output, Output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CybersourceUnifiedService,
  type ClienteCybersource,
  type FormCybersource,
} from './cybersource-unified.service';
import { PayCybersourceUnifiedService, type AccesoPedido, type Producto } from '@services/pay-cybersource-unified.servicio';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentOrderService } from '@services/payment-order.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-cybersource-unified-pay',
  imports: [
    CustomTranslatePipe
  ],
  templateUrl: './cybersource-unified-pay.component.html',
  styleUrl: './cybersource-unified-pay.component.scss',
})
export default class CybersourceUnifiedPayComponent {

  readonly closeModal = output<void>();

  protected readonly isLoading = signal(false);
  protected readonly isOccupied = signal(false);
  protected readonly isConfirming = signal(false);
  protected readonly isFormMounted = signal(false);
  protected readonly showRetryButton = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly statusMessage = signal('');
  protected readonly accessData = signal<AccesoPedido | undefined>(undefined);

  protected readonly canStartPayment = computed(() => !this.isOccupied());
  protected readonly hasOrder = computed(
    () => Boolean(this.paymentOrderService.paymentOrderPay()),
  );

  public codeCollection: string;

  private cybersourceClient?: ClienteCybersource;
  private cybersourceForm?: FormCybersource;
  private isDestroyed = false;

  private readonly payCybersourceUnifiedService = inject(PayCybersourceUnifiedService);
  private readonly cybersource = inject(CybersourceUnifiedService);
  private readonly destroyRef = inject(DestroyRef);
  public readonly paymentOrderService = inject(PaymentOrderService);
  private readonly activeRoute = inject(ActivatedRoute);
  public readonly router = inject(Router);

  constructor() {
    this.codeCollection = this.activeRoute.snapshot.paramMap.get('code_collection') ?? '';

    this.destroyRef.onDestroy(() => {
      this.isDestroyed = true;
      this.clearForm();
    });

    if (this.hasOrder()) {
      void this.initPay();
    }
  }

  /** Coordina creación de acceso, sesión, formulario alojado y confirmación final. */
  protected async initPay(): Promise<void> {
    if (!this.canStartPayment()) return;

    const currentOrder = this.paymentOrderService.paymentOrderPay();
    const targetCode = currentOrder?.codeCollection || this.codeCollection;
    if (!targetCode) {
      this.errorMessage.set('No se encontró un pedido válido para iniciar el pago.');
      return;
    }

    this.isOccupied.set(true);
    this.isLoading.set(true);
    this.isConfirming.set(false);
    this.isFormMounted.set(false);
    this.showRetryButton.set(false);
    this.errorMessage.set('');
    this.statusMessage.set('Preparando tu sesión de pago…');

    let paymentSent = false;

    try {
      const accessResponse = await this.payCybersourceUnifiedService.createAccess({
        codeCollection: targetCode,
      });

      if (this.isDestroyed) {
        this.clearForm();
        return;
      }

      const accessPayload: AccesoPedido = {
        code: targetCode,
        access: accessResponse.access!,
      };
      this.accessData.set(accessPayload);

      const sessionData = await this.payCybersourceUnifiedService.session(accessPayload);

      if (this.isDestroyed) {
        this.clearForm();
        return;
      }

      this.cybersourceClient = await this.cybersource.createClient(
        sessionData.context,
        sessionData.library,
        sessionData.integrity,
      );

      if (this.isDestroyed) {
        this.clearForm();
        return;
      }

      this.cybersourceForm = await this.cybersourceClient.createCheckout({
        autoProcessing: false,
      });

      if (this.isDestroyed) {
        this.clearForm();
        return;
      }

      this.isLoading.set(false);
      this.isFormMounted.set(true);
      this.statusMessage.set('Selecciona tu método de pago para continuar.');

      const paymentToken = await this.cybersourceForm.mount('#payment-methods');

      if (this.isDestroyed) {
        this.clearForm();
        return;
      }

      paymentSent = true;
      this.isConfirming.set(true);
      this.isFormMounted.set(false);
      this.statusMessage.set('Confirmando el pago. No cierres ni recargues esta página.');

      const { data } = await this.payCybersourceUnifiedService.confirm(
        accessPayload,
        paymentToken,
      );

      const paymentOrderConfirm = data;

      if (this.isDestroyed) return;

      if (paymentOrderConfirm.status === 'PAID') {
        this.statusMessage.set('Pago confirmado correctamente.');
        await this.router.navigate(['pay/notification', targetCode]);
        return;
      }

      // El pago no quedó en estado PAID: se informa y se habilita reintento.
      this.statusMessage.set('');
      this.errorMessage.set(
        `El pago no fue completado (estado: ${paymentOrderConfirm.status || 'no confirmado'}).`,
      );
      this.showRetryButton.set(true);
    } catch (error) {
      if (!this.isDestroyed) {
        this.statusMessage.set('');
        this.errorMessage.set(
          paymentSent
            ? 'No recibimos la confirmación final. Consulta el estado de tu pedido antes de intentar otro pago.'
            : this.resolveErrorMessage(error),
        );
        this.showRetryButton.set(true);
      }
    } finally {
      this.clearForm();
      this.isLoading.set(false);
      this.isConfirming.set(false);
      this.isFormMounted.set(false);
      this.isOccupied.set(false);
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 503) {
      return 'El comercio todavía no habilitó los pagos con tarjeta. Intenta más tarde.';
    }
    return 'No se pudo completar el formulario de pago. Verifica el estado de tu pedido antes de continuar.';
  }

  private clearForm(): void {
    this.cybersourceForm?.destroy();
    this.cybersourceClient?.destroy();
    this.cybersourceForm = undefined;
    this.cybersourceClient = undefined;
  }
}
