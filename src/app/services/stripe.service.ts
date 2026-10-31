import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom, Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { ResponseApi } from '@interfaces/responseApi';

@Injectable({
    providedIn: 'root'
})
export class StripeService {

    apiUrl = `${environment.api}/stripe`;
    private http = inject(HttpClient);

    // llc
    generatePaymentLlc(data: any): Promise<any> {
        return lastValueFrom(this.http.post(this.apiUrl + '/generatePayment', data));
    }

    getPaymentDetailLlc(id: any): Promise<any> {
        return lastValueFrom(this.http.get(this.apiUrl + '/getPaymentDetail/' + id));
    }

    createCustomerLlc(data: any): Promise<any> {
        return lastValueFrom(this.http.post(this.apiUrl + '/createCustomer', data));
    }

    // inc
    generatePaymentInc(data: any): Promise<any> {
        return lastValueFrom(this.http.post(this.apiUrl + '/generatePaymentInc', data));
    }

    getPaymentDetailInc(id: any): Promise<any> {
        return lastValueFrom(this.http.get(this.apiUrl + '/getPaymentDetailInc/' + id));
    }

}