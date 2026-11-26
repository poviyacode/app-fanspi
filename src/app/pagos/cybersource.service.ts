import { DOCUMENT, inject, Service } from '@angular/core';

// Los nombres de la API externa se conservan según el contrato de CyberSource.
export interface FormularioCybersource {
  mount(destino: string): Promise<string>;
  destroy(): void;
}
export interface ClienteCybersource {
  createCheckout(opciones: { autoProcessing: false }): Promise<FormularioCybersource>;
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
export class CybersourceServicio {
  private readonly documento = inject(DOCUMENT);
  private carga?: Promise<void>;

  /** Carga una sola vez el SDK permitido del sandbox y crea el cliente con el contexto del servidor. */
  async crearCliente(contexto: string, direccion: string, integridad: string) {
    console.log('direccion', direccion);
    console.log('integridad', integridad);

    const url = new URL(direccion);
    if (url.protocol !== 'https:' ||
      !['testup.cybersource.com', 'apitest.cybersource.com'].includes(url.hostname) ||
      url.port || url.username || url.password ||
      !url.pathname.startsWith('/uc/v1/assets/') ||
      !/^sha(256|384|512)-[A-Za-z0-9+/]+=*$/.test(integridad))
      throw new Error('Biblioteca no permitida.');
    const ventana = this.documento.defaultView;
    if (!ventana) throw new Error('Navegador no disponible.');
    if (!ventana.VAS) {
      this.carga ??= new Promise<void>((resolver, rechazar) => {
        const etiqueta = this.documento.createElement('script');
        const temporizador = ventana.setTimeout(() => fallar(), 20000);
        const fallar = () => {
          ventana.clearTimeout(temporizador);
          etiqueta.remove();
          this.carga = undefined;
          rechazar(new Error('No se pudo cargar el formulario seguro.'));
        };
        etiqueta.src = direccion;
        etiqueta.integrity = integridad;
        etiqueta.crossOrigin = 'anonymous';
        etiqueta.async = true;
        etiqueta.onload = () => {
          ventana.clearTimeout(temporizador);
          resolver();
        };
        etiqueta.onerror = fallar;
        this.documento.head.appendChild(etiqueta);
      });
      await this.carga;
    }
    if (!ventana.VAS) {
      this.carga = undefined;
      throw new Error('El formulario seguro no está disponible.');
    }
    return ventana.VAS.UnifiedCheckout(contexto);
  }
}
