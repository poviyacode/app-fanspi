import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { lastValueFrom, Observable, throwError } from 'rxjs';
import { retry, catchError, delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { StateCity } from '../interfaces/stateCity';
import { ResSiteRedirect, Site } from '@interfaces/site';
import { QrSimple } from '@interfaces/qtAtc';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class QrAtcService {

  apiUrl = `${environment.api}/qrAtc`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  generateQr(dataQuery: any): Observable<object> {
    return this.http.post<object>(this.apiUrl + '/generateQr', dataQuery);
  }

  generateQrSimple(dataQuery: any): Observable<object> {
    return this.http.post<object>(this.apiUrl + '/generateQrSimple', dataQuery);
  }

  generateQrPix(dataQuery: any): Observable<object> {
    return this.http.post<object>(this.apiUrl + '/generateQrPix', dataQuery);
  }

  //--- signals
  public readonly qrSimple = signal<QrSimple | null>(this.storageService.loadFromStorage<QrSimple | null>('qrSimple', null));

  addQrSimple(value: QrSimple) {
    this.storageService.saveToStorage('qrSimple', value);
    this.qrSimple.set(value);
  }

  updateQrSimple(updates: Partial<QrSimple>) {
    const current = this.qrSimple();
    if (!current) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updated = {
      ...current,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.qrSimple.set(updated);
    this.storageService.saveToStorage('qrSimple', updated);
  }

  resetQrSimple() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('qrSimple');
    }
    this.qrSimple.set(null);
  }
}
