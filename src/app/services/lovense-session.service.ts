import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, delay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { LovenseSession } from '@interfaces/lovenseSession';
import { StorageService } from './storage.service';

@Service()
export class LovenseSessionService {

  apiUrl = `${environment.api}/lovense-session`;

  private http = inject(HttpClient);
  storageService: StorageService = inject(StorageService);

  generateQr(data: any): Observable<any> {
    const uri = this.apiUrl + '/qr';
    return this.http.post<any>(uri, data, Headers.HttpOptions());
  }

  disconnectAllToys(data: any): Observable<any> {
    const uri = this.apiUrl + '/disconnectAllToys';
    return this.http.post<any>(uri, data, Headers.HttpOptions());
  }

  getSession(UserId: string): Observable<any> {
    const uri = this.apiUrl + '/getSession/' + UserId;
    return this.http.get<any>(uri, Headers.HttpOptions());
  }

  sendCommandCloud(data: any): Observable<any> {
    const uri = this.apiUrl + '/sendCommandCloud';
    return this.http.post<any>(uri, data, Headers.HttpOptions());
  }

  stopCommandCloud(data: any): Observable<any> {
    const uri = this.apiUrl + '/stopCommandCloud';
    return this.http.post<any>(uri, data, Headers.HttpOptions());
  }

  //--- signals
  public readonly lovenseSession = signal<LovenseSession | null>(this.storageService.loadFromStorage<LovenseSession | null>('lovense-session', null));

  addLovenseSession(value: LovenseSession) {
    this.storageService.saveToStorage('lovense-session', value);
    this.lovenseSession.set(value);
  }

  updateLovenseSession(updates: Partial<LovenseSession>) {
    const currentLovenseSession = this.lovenseSession();
    if (!currentLovenseSession) return;

    const updatedLovenseSession = {
      ...currentLovenseSession,
      ...updates
    };

    this.lovenseSession.set(updatedLovenseSession);
    this.storageService.saveToStorage('lovense-session', updatedLovenseSession);
  }

  resetLovenseSession() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('lovense-session');
    }
    this.lovenseSession.set(null);
  }
}
