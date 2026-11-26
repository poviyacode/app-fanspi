import { DOCUMENT, inject, Service } from '@angular/core';

// Los nombres de la API externa se conservan según el contrato de CyberSource.
export interface FormCybersource {
  mount(destino: string): Promise<string>;
  destroy(): void;
}
export interface ClienteCybersource {
  createCheckout(opciones: { autoProcessing: false }): Promise<FormCybersource>;
  destroy(): void;
}
interface BibliotecaCybersource {
  UnifiedCheckout(contexto: string): Promise<ClienteCybersource>;
}
declare global {
  interface Window {
    VAS?: BibliotecaCybersource;
  }
}

@Service()
export class CybersourceUnifiedService {
  private readonly document = inject(DOCUMENT);
  private charge?: Promise<void>;

  /** Carga una sola vez el SDK permitido del sandbox y crea el cliente con el contexto del servidor. */
  async createClient(contexto: string, library: string, integrity: string) {
    const url = new URL(library);
    if (url.protocol !== 'https:' ||
      !['testup.cybersource.com', 'apitest.cybersource.com'].includes(url.hostname) ||
      url.port || url.username || url.password ||
      !url.pathname.startsWith('/uc/v1/assets/') ||
      !/^sha(256|384|512)-[A-Za-z0-9+/]+=*$/.test(integrity))
      throw new Error('Biblioteca no permitida.');
    const window = this.document.defaultView;
    if (!window) throw new Error('Navegador no disponible.');
    if (!window.VAS) {
      this.charge ??= new Promise<void>((resolver, rechazar) => {
        const etiqueta = this.document.createElement('script');
        const temporizador = window.setTimeout(() => fallar(), 20000);
        const fallar = () => {
          window.clearTimeout(temporizador);
          etiqueta.remove();
          this.charge = undefined;
          rechazar(new Error('No se pudo cargar el formulario seguro.'));
        };
        etiqueta.src = library;
        etiqueta.integrity = integrity;
        etiqueta.crossOrigin = 'anonymous';
        etiqueta.async = true;
        etiqueta.onload = () => {
          window.clearTimeout(temporizador);
          resolver();
        };
        etiqueta.onerror = fallar;
        this.document.head.appendChild(etiqueta);
      });
      await this.charge;
    }
    if (!window.VAS) {
      this.charge = undefined;
      throw new Error('El formulario seguro no está disponible.');
    }
    return window.VAS.UnifiedCheckout(contexto);
  }
}
