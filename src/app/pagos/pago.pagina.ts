import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { PagosServicio, type AccesoPedido, type Pedido, type Producto } from './pagos.servicio';
import {
  CybersourceServicio,
  type ClienteCybersource,
  type FormularioCybersource,
} from './cybersource.service';

@Component({
  selector: 'app-pago',
  templateUrl: './pago.pagina.html',
  styleUrl: './pago.pagina.css',
})
export class PagoPagina {
  private readonly pagos = inject(PagosServicio);
  private readonly cybersource = inject(CybersourceServicio);
  private readonly destruccion = inject(DestroyRef);
  protected readonly producto = signal<Producto | null>(null);
  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly error = signal('');
  protected readonly mensaje = signal('');
  protected readonly puedeCrear = computed(
    () => !this.ocupado() && !this.pedido() && Boolean(this.producto()?.disponible),
  );
  protected readonly resumenEstado = computed(() => {
    const estado = this.pedido()?.estado;
    switch (estado) {
      case 'autorizado':
        return 'Pago autorizado. La captura todavía debe confirmarse.';
      case 'captura_pendiente':
        return 'Pago recibido. La captura está pendiente de confirmación.';
      case 'rechazado':
        return 'El pago fue rechazado.';
      case 'revision':
      case 'procesando':
        return 'Estamos verificando el resultado. No repitas el pago; conserva la referencia y contacta al comercio.';
      case 'error':
        return 'No se pudo preparar el pago. Puedes comenzar un nuevo pedido.';
      case 'listo':
        return 'Tu sesión está preparada. Completa los datos en el formulario seguro.';
      default:
        return '';
    }
  });
  private acceso?: AccesoPedido;
  private cliente?: ClienteCybersource;
  private formulario?: FormularioCybersource;
  private destruido = false;

  constructor() {
    this.destruccion.onDestroy(() => {
      this.destruido = true;
      this.limpiarFormulario();
    });
    void this.cargar();
  }

  /** Recupera el acceso al pedido de esta pestaña; nunca conserva datos de tarjeta ni su token. */
  protected async cargar() {
    this.ocupado.set(true);
    this.error.set('');
    try {
      this.producto.set(await this.pagos.obtenerProducto());
      const guardado = sessionStorage.getItem('pedido-pendiente');
      if (guardado) {
        const datos: unknown = JSON.parse(guardado);
        if (
          typeof datos === 'object' &&
          datos !== null &&
          'identificador' in datos &&
          'acceso' in datos &&
          typeof datos.identificador === 'string' &&
          typeof datos.acceso === 'string'
        ) {
          this.acceso = { identificador: datos.identificador, acceso: datos.acceso };
          await this.consultar();
        }
      }
    } catch {
      this.error.set('No pudimos cargar el pedido. Comprueba la conexión y vuelve a consultar.');
    } finally {
      this.ocupado.set(false);
    }
  }

  /** Coordina pedido, formulario alojado y confirmación; ante incertidumbre consulta sin reenviar. */
  protected async iniciarPago() {
    if (!this.puedeCrear()) return;
    this.ocupado.set(true);
    this.error.set('');
    this.mensaje.set('Preparando tu pago…');
    let enviado = false;
    try {
      const pedido = await this.pagos.crearPedido();
      this.acceso = { identificador: pedido.identificador, acceso: pedido.acceso };
      console.log('acceso', this.acceso);
      this.pedido.set(pedido);
      sessionStorage.setItem('pedido-pendiente', JSON.stringify(this.acceso));
      const sesion = await this.pagos.crearSesion(this.acceso);
      console.log('sesion', sesion);
      this.cliente = await this.cybersource.crearCliente(sesion.contexto, sesion.biblioteca, sesion.integridad);
      console.log('cliente', this.cliente);
      if (this.destruido) {
        this.limpiarFormulario();
        return;
      }
      this.formulario = await this.cliente.createCheckout({ autoProcessing: false });
      if (this.destruido) {
        this.limpiarFormulario();
        return;
      }
      this.mensaje.set('Selecciona tu método de pago para continuar.');
      const token = await this.formulario.mount('#metodos-pago');
      if (this.destruido) return;
      this.mensaje.set('Confirmando el pago. No cierres esta página.');
      enviado = true;
      this.pedido.set(await this.pagos.confirmar(this.acceso, token));
      this.mensaje.set('');
    } catch (error) {
      if (!this.destruido) {
        this.mensaje.set('');
        this.error.set(
          enviado
            ? 'No recibimos la confirmación. Consulta el estado antes de intentar otro pago.'
            : this.describirError(error),
        );
        if (this.acceso) await this.consultar();
      }
    } finally {
      this.limpiarFormulario();
      this.ocupado.set(false);
    }
  }

  /** Lee el estado guardado por la API; no consulta ni concilia directamente con CyberSource. */
  protected async consultar() {
    if (!this.acceso) return;
    try {
      this.pedido.set(await this.pagos.consultar(this.acceso));
    } catch {
      this.error.set(
        'No pudimos consultar el estado. Conserva la referencia y vuelve a consultar.',
      );
    }
  }

  /** Permite otro pedido solo en estados seguros; bloquea pagos autorizados o pendientes de revisión. */
  protected reiniciar() {
    if (
      this.ocupado() ||
      !['creado', 'listo', 'error', 'rechazado'].includes(this.pedido()?.estado ?? '')
    )
      return;
    sessionStorage.removeItem('pedido-pendiente');
    this.acceso = undefined;
    this.pedido.set(null);
    this.error.set('');
  }

  private describirError(error: unknown) {
    if (error instanceof HttpErrorResponse && error.status === 503)
      return 'El comercio todavía no habilitó los pagos. Intenta más tarde.';
    return 'No se completó el formulario de pago. Consulta el estado de tu pedido antes de continuar.';
  }

  private limpiarFormulario() {
    this.formulario?.destroy();
    this.cliente?.destroy();
    this.formulario = undefined;
    this.cliente = undefined;
  }
}
