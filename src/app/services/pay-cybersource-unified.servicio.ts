import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface Producto {
  codigo: string;
  nombre: string;
  importe: string;
  moneda: string;
  disponible: boolean;
  entorno: string;
}

export interface AccesoPedido {
  code: string;
  access: string;
}

export interface Sesion {
  context: string;
  expiresAt: string;
  library: string;
  integrity: string;
}

@Service()
export class PayCybersourceUnifiedService {
  //apiUrl = `${environment.api}/pay-cybersourse-unified`;
  apiUrl = `/api/pay-cybersourse-unified`;

  private readonly http = inject(HttpClient);

  createAccess(data: any) {
    return firstValueFrom(
      this.http.post<any & AccesoPedido>(`${this.apiUrl}/createAccess`, data),
    );
  }

  session(pedido: AccesoPedido) {
    return firstValueFrom(
      this.http.post<Sesion>(`${this.apiUrl}/${pedido.code}/session`, {},
        { headers: { 'x-payment-access': pedido.access } }
      ),
    );
  }

  confirm(pedido: AccesoPedido, token: string) {
    return firstValueFrom(
      this.http.post<any>(
        `${this.apiUrl}/${pedido.code}/confirm`, { token },
        { headers: { 'x-payment-access': pedido.access } }
      ),
    );
  }

  consultar(pedido: AccesoPedido) {
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/${pedido.code}`, this.opciones(pedido)),
    );
  }

  obtenerProducto() {
    return firstValueFrom(this.http.get<Producto>(`${this.apiUrl}/producto`));
  }

  private opciones(pedido: AccesoPedido) {
    return { headers: { 'x-payment-access': pedido.access } };
  }
}
