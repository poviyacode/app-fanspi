import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Producto {
  codigo: string;
  nombre: string;
  importe: string;
  moneda: string;
  disponible: boolean;
  entorno: string;
}
export interface Pedido {
  identificador: string;
  nombre: string;
  importe: string;
  moneda: string;
  estado: string;
  transaccion?: string;
}
export interface AccesoPedido {
  identificador: string;
  acceso: string;
}
export interface Sesion {
  contexto: string;
  venceEn: string;
  biblioteca: string;
  integridad: string;
}

@Service()
export class PagosServicio {
  apiUrl = `/api/pagos`;
  private readonly http = inject(HttpClient);

  obtenerProducto() {
    return firstValueFrom(this.http.get<Producto>(`${this.apiUrl}/producto`));
  }
  crearPedido() {
    return firstValueFrom(
      this.http.post<Pedido & AccesoPedido>(`${this.apiUrl}`, { producto: 'prueba' }),
    );
  }
  crearSesion(pedido: AccesoPedido) {
    return firstValueFrom(
      this.http.post<Sesion>(
        `${this.apiUrl}/${pedido.identificador}/sesion`,
        {},
        this.opciones(pedido),
      ),
    );
  }
  confirmar(pedido: AccesoPedido, token: string) {
    return firstValueFrom(
      this.http.post<Pedido>(
        `${this.apiUrl}/${pedido.identificador}/confirmacion`,
        { token },
        this.opciones(pedido),
      ),
    );
  }
  consultar(pedido: AccesoPedido) {
    return firstValueFrom(
      this.http.get<Pedido>(`${this.apiUrl}/${pedido.identificador}`, this.opciones(pedido)),
    );
  }
  private opciones(pedido: AccesoPedido) {
    return { headers: { 'X-Acceso-Pago': pedido.acceso } };
  }
}
