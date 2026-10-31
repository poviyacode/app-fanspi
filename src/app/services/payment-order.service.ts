import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { PaymentOrder, Calculation, ResPaymentOrderPay, PayWithOrder } from '../interfaces/paymentOrder';
import { Headers } from '@core/common/http-headers';
import { ResponseApi } from '@interfaces/responseApi';
import { Money } from '@interfaces/money';
import { StorageService } from './storage.service';
import { SocketService } from './socket.service';

interface Personal {
  name: string,
  lastname: string,
  email: string,
  phonePrefix: string,
  phone: string,
  address: string,
  city: string,
  state: string,
  country: string,
  postalCode: string,
}

@Injectable({
  providedIn: 'root'
})
export class PaymentOrderService {

  apiUrl = `${environment.api}/payment-order`;
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private socketService = inject(SocketService);

  update(id: string, data: any): Observable<PaymentOrder> {
    return this.http.put<PaymentOrder>(this.apiUrl + '/' + id, data);
  }

  amountCalculationProccess(data: any): Observable<ResponseApi> {
    return this.http.post<ResponseApi>(this.apiUrl + '/amountCalculation', data);
  }

  processPayment(id: string, data: any): Observable<ResponseApi> {
    return this.http.put<ResponseApi>(this.apiUrl + '/processPayment/' + id, data);
  }

  transactionPaypal(id: string, data: any): Observable<ResponseApi> {
    return this.http.put<ResponseApi>(this.apiUrl + '/transactionPaypal/' + id, data);
  }

  transactionStripe(id: string, data: any): Observable<ResponseApi> {
    return this.http.put<ResponseApi>(`${this.apiUrl}` + '/transactionStripe/' + id, data);
  }

  createPaymentAccount(data: any): Observable<ResponseApi> {
    return this.http.post<ResponseApi>(this.apiUrl + '/payment-account', data, Headers.HttpOptions());
  }

  signedDatafiels(data: any): Observable<ResponseApi> {
    return this.http.post<ResponseApi>(this.apiUrl + '/signedDatafiels', data);
  }

  findOne(id: string): Observable<PaymentOrder> {

    return this.http.get<PaymentOrder>(this.apiUrl + '/' + id,);
  }

  findOneCodeCollection(id: string): Observable<PaymentOrder> {
    return this.http.get<PaymentOrder>(this.apiUrl + '/codeCollection/' + id,);
  }

  findOneCodeCollectionPay(id: string): Observable<ResPaymentOrderPay> {
    return this.http.get<ResPaymentOrderPay>(`${this.apiUrl}/codeCollectionPay/${id}`)
      .pipe(
        tap((res) => {
          if (!res) return;

          // Conectar el socket si no está activo
          if (!this.socketService.socket) {
            this.socketService.connect();
          }

          // Unirse a la sala de pagos de forma segura
          const roomName = res.codeCollection!;
          this.socketService.joinRoom(roomName, (socketRes: any) => {
            if (socketRes && socketRes.status === 'joined') {
              console.log('Socket joined room:', socketRes.room);
            }
          });
        }),
        catchError((err) => {
          // Propaga el error original al componente en lugar de mutarlo a null
          return throwError(() => err);
        })
      );
  }

  amountCalculationPay(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/amountCalculationPay', data);
  }

  fingerPrinting(): Observable<object[]> {
    //console.log(1)
    // fanspi@hotmail.com -> bb4ba6f682fa9fe4dddc8b2d191e82f9

    const url = `https://api.fpjs.io/visitors/someVisitorID?api_key=GrU6LsGJjthl3j8uhwUK`;
    return this.http.get<any[]>(url)
      .pipe(
        tap(resp => {
          //this.ipapiRes = JSON.stringify(resp!);
          //localStorage.setItem('ipapi', this.ipapiRes);
        }),
        map(resp => resp),
        catchError(err => of(err.error.msg))
      );
  }

  paymentOrder = signal<PaymentOrder | null>(null);

  addPaymentOrder(value: PaymentOrder) {
    this.paymentOrder.set(value);
  }

  personal = signal<Personal | null>(null);

  addPersonal(value: Personal) {
    this.personal.set(value);
  }

  // amount calculation
  public readonly amountCalculation = signal<Calculation | null>(this.storageService.loadFromStorage<Calculation | null>('amountCalculation', null));

  addAmountCalculation(value: Calculation) {
    this.storageService.saveToStorage('amountCalculation', value);
    this.amountCalculation.set(value);
  }

  resetAmountCalculation() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('amountCalculation');
    }
    this.amountCalculation.set(null);
  }

  // pay with order
  public readonly payWithOrder = signal<PayWithOrder | null>(this.storageService.loadFromStorage<PayWithOrder | null>('payWithOrder', null));

  addPayWithOrder(value: PayWithOrder) {
    this.storageService.saveToStorage('payWithOrder', value);
    this.payWithOrder.set(value);
  }

  resetPayWithOrder() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('payWithOrder');
    }
    this.payWithOrder.set(null);
  }

  //--- signals
  public readonly paymentOrderPay = signal<ResPaymentOrderPay | null>(this.storageService.loadFromStorage<ResPaymentOrderPay | null>('paymentOrderPay', null));

  addPaymentOrderPay(value: ResPaymentOrderPay) {
    this.storageService.saveToStorage('paymentOrderPay', value);
    this.paymentOrderPay.set(value);
  }

  updatePaymentOrderPay(updates: Partial<ResPaymentOrderPay>) {
    const current = this.paymentOrderPay();
    if (!current) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updated = {
      ...current,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.paymentOrderPay.set(updated);
    this.storageService.saveToStorage('paymentOrderPay', updated);
  }

  resetPaymentOrderPay() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('paymentOrderPay');
    }
    this.paymentOrderPay.set(null);
  }

  /**
   * Retorna el último intento de pago dentro del array 'installments' si fue rechazado.
   * @param paymentOrder Objeto de la orden de pago actual
   */
  getLastInstallmentError(paymentOrder: any): any | null {
    if (paymentOrder?.installments && paymentOrder.installments.length > 0) {
      const last = paymentOrder.installments[paymentOrder.installments.length - 1];
      if (last?.status === 'DECLINE') {
        return last;
      }
    }
    return null;
  }

  /**
   * Extrae de manera segura el mensaje de error de una orden de pago,
   * buscando primero en los intentos de installments y luego en la raíz.
   * @param paymentOrder Objeto de la orden de pago actual
   */
  getErrorMessage(paymentOrder: any): string | null {
    if (!paymentOrder) return null;

    // 1. Intentar buscar en el último intento de 'installments' (Caso Cybersource)
    const lastInstallmentError = this.getLastInstallmentError(paymentOrder);
    if (lastInstallmentError) {
      return lastInstallmentError.receipt?.message || lastInstallmentError.details?.message || null;
    }

    // 2. Fallback por si el error viene mapeado directamente en la raíz de la orden
    if (paymentOrder.status === 'DECLINE' || paymentOrder.status === 'ERROR') {
      return paymentOrder.receipt?.message || paymentOrder.details?.message || null;
    }

    return null;
  }
}
