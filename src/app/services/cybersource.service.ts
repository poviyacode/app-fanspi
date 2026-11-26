import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CybersourceService {

  apiUrl = `${environment.api}/cybersource`;
  private http = inject(HttpClient);

  generate(data: any): Observable<object> {
    return this.http.post<any>(this.apiUrl + '/signeddatafields', data);
  }

  getCaptureContext(): Observable<{ jwt: string }> {
    return this.http.post<{ jwt: string }>(this.apiUrl + '/payments/generateCaptureContext', {});
  }

  processPayment(transientToken: string, amount: number, orderId: string): Observable<any> {
    return this.http.post(this.apiUrl + '/payments/process', { transientToken, amount, orderId, currency: 'USD' });
  }
}
