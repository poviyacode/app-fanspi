import { ApplicationRef, Component, ComponentRef, computed, effect, HostListener, Inject, inject, Input, PLATFORM_ID, signal, ViewChild, ViewContainerRef, WritableSignal, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { CybersourceService } from '@services/cybersource.service';

declare var CyberSource: any; // Declarar la variable global del SDK

@Component({
  selector: 'app-a',
  imports: [

  ],
  templateUrl: './a.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './a.component.scss'
})
export default class AComponent {

  @ViewChild('unifiedCheckoutContainer') container: ElementRef;

  captureContextJwt: string;
  transientToken: string;
  isTokenReady = false;
  amount = 100.00; // Ejemplo
  orderId = 'ORDER-12345';

  private paymentApi = Inject(CybersourceService);

  async ngOnInit() {
    // 1. Pedir el Capture Context al backend
    const response = await this.paymentApi.getCaptureContext().toPromise();
    this.captureContextJwt = response.jwt;
  }

  ngAfterViewInit() {
    // 2. Inicializar Unified Checkout una vez que tenemos el JWT
    this.initializeUnifiedCheckout();
  }

  initializeUnifiedCheckout() {
    const config = {
      captureContext: this.captureContextJwt,
      container: '#unified-checkout-container', // O el ElementRef.nativeElement
      // Configuración de apariencia y campos
      appearance: {
        variables: {
          fontFamily: 'Arial, sans-serif',
          // Puedes personalizar colores aquí
        }
      },
      callbacks: {
        success: (response: any) => {
          // 3. El SDK nos devuelve el Transient Token
          this.transientToken = response.data.transientToken;
          this.isTokenReady = true;
          console.log('Token obtenido:', this.transientToken);
        },
        error: (error: any) => {
          console.error('Error en Unified Checkout', error);
        }
      }
    };

    // Inicializar el SDK (la sintaxis exacta puede variar según la versión del SDK de CyberSource)
    CyberSource.checkout(config);
  }

  async submitPayment() {
    if (!this.isTokenReady) return;

    try {
      // 4. Enviar el token a NestJS para procesar el cobro
      const result = await this.paymentApi.processPayment(this.transientToken, this.amount, this.orderId).toPromise();

      if (result.status === 'AUTHORIZED' || result.status === 'AUTHORIZED_PENDING_REVIEW') {
        alert('¡Pago exitoso!');
        // Redirigir a página de éxito
      } else {
        alert('Error en el pago: ' + result.message);
      }
    } catch (error) {
      console.error('Error procesando pago', error);
    }
  }
}