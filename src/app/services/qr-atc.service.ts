import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom, Observable, throwError } from 'rxjs';
import { retry, catchError, delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { StateCity } from '../interfaces/stateCity';
import { ResSiteRedirect, Site } from '@interfaces/site';

@Injectable({
  providedIn: 'root'
})
export class QrAtcService {

  apiUrl = `${environment.api}/qrAtc`;

  private http = inject(HttpClient);

  generateQr(dataQuery: any): Observable<object> {
    return this.http.post<object>(this.apiUrl + '/generateQr', dataQuery);
  }

}
