import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '@environments/environment';
import { delay, lastValueFrom, Observable } from 'rxjs';
import { Headers } from '../core/common/http-headers';
import { Token } from '@interfaces/token';
import { StorageService } from './storage.service';

export interface ResCreateToken {
  token?: Token,
  sendEmail?: object
}

export interface ResVerifyCode {
  message: string,
  ok: boolean
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  api = `${environment.api}/token`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  create(data: any): Promise<ResCreateToken> {
    data.Site = environment.site;
    return lastValueFrom(this.http.post<ResCreateToken>(this.api + '/', data, Headers.HttpOptions()).pipe(delay(200)));
  }

  verifyCode(data: Token): Observable<ResVerifyCode> {
    return this.http.post<ResVerifyCode>(this.api + '/verifyCode', data, Headers.HttpOptions()).pipe(delay(200));;
  }

  // storage
  public readonly token = signal<Token | null>(this.storageService.loadFromStorage<Token | null>('token', null));

  addToken(value: Token) {
    this.storageService.saveToStorage('token', value);
    this.token.set(value);
  }

  updateToken(updates: Partial<Token>) {
    const currentUser = this.token();
    if (!currentUser) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedUser = {
      ...currentUser,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.token.set(updatedUser);
    this.storageService.saveToStorage('token', updatedUser);
  }

  resetToken() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.token.set(null);
  }

}
