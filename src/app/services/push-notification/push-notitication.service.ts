
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { delay, firstValueFrom, lastValueFrom, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../storage.service';
import { Headers } from '../../core/common/http-headers';
import { AuthService } from '../auth.service';
import { PushNotification } from '@interfaces/pushNotification';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';

//-- save memberships
export interface UserPushNotification {
  status: boolean;
  webpush?: PushNotification;
  telegram?: PushNotification;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  isBrowser: boolean;

  eventPushNotification = signal<any>(null);

  apiUrl = `${environment.api}/push-notification`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private swPush = inject(SwPush);
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.onEventNotifications();
    }
  }

  findOneUser(browserId: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/findOneUser/' + browserId, Headers.HttpOptions())

  }

  findByUser(dataDto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/findByUser', dataDto, Headers.HttpOptions())
  }

  getFollowersSreaming(): Promise<any> {
    return lastValueFrom(this.http.get<any>(this.apiUrl + '/getFollowersSreaming', Headers.HttpOptions())
    );
  }

  getFollowersOnline(): Promise<any> {
    return lastValueFrom(this.http.get<any>(this.apiUrl + '/getFollowersOnline', Headers.HttpOptions())
    );
  }

  getReveiverChat(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(this.apiUrl + '/getReveiverChat/', data, Headers.HttpOptions())
    );
  }

  getReveiverVideoCall(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(this.apiUrl + '/getReveiverVideoCall/', data, Headers.HttpOptions())
    );
  }

  unsubscribeTelegram(): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/unsubscribeTelegram', Headers.HttpOptions())
  }

  // active
  async enableNotify(): Promise<PushSubscription | null> {

    if (!this.swPush.isEnabled) {
      throw new Error('El service worker no está disponible.');
    }
    try {
      if (Notification.permission !== 'granted') {
        // Si no hay permiso, solicitar suscripción
        return await this.requestSubscription();
      } else {
        const refreshPageText = this.translate.instant('refreshPage');
        // Si ya tiene permiso, preguntar si desea refrescar el token
        const isConfirm = confirm('');
        if (isConfirm) {
          return await this.requestSubscription();
        } else {
          // Retornar la suscripción existente
          return await this.getSubscription();
        }
      }
    } catch (error: any) {
      throw new Error('No se pudo habilitar las notificaciones.');
    }
  }

  // token
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swPush.isEnabled) {
      throw new Error('El service worker no está disponible.');
    }

    try {
      // Obtener la suscripción actual
      const subscription = await firstValueFrom(this.swPush.subscription);
      if (subscription) {
        return subscription; // Retornar la suscripción completa
      } else {
        throw new Error('No hay una suscripción activa.');
      }
    } catch (error: any) {
      throw new Error('No se pudo obtener la suscripción.');
    }
  }

  // inactive
  unsubscribe(): void {
    if (this.swPush.isEnabled && Notification.permission === 'granted') {
      this.swPush.unsubscribe();
    }
  }

  // request suscription
  private async requestSubscription(): Promise<PushSubscription> {
    if (!environment.publicKey) {
      throw new Error('La clave pública (publicKey) no está configurada en el archivo environment.');
    }

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.publicKey,
      });
      this.onEventNotifications();
      return subscription; // Retornar la suscripción completa
    } catch (error: any) {
      throw new Error('No se pudo generar la suscripción.');
    }
  }

  // handling notification events
  private onEventNotifications(): void {
    // Verificar que 'Notification' existe en el objeto window
    if (this.isBrowser &&
      'Notification' in window &&
      this.swPush.isEnabled &&
      Notification.permission === 'granted') {

      this.swPush.notificationClicks.subscribe((message) => {
        this.eventPushNotification.set({ event: 'CLICKS', message });
      });

      this.swPush.messages.subscribe((message) => {
        this.eventPushNotification.set({ event: 'SEND', message });
      });
    }
  }

  private onEventNotifications2(): void {
    if (this.swPush.isEnabled && Notification.permission === 'granted') {
      this.swPush.notificationClicks.subscribe((message) => {
        const data = {
          event: 'CLICKS',
          message
        };
        this.eventPushNotification.set(data);
      });

      this.swPush.messages.subscribe((message) => {
        const data = {
          event: 'SEND',
          message
        };
        this.eventPushNotification.set(data);
      });
    }
  }

  // notification
  requestPermission() {
    if (this.isBrowser && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Permiso concedido para mostrar notificaciones.');
        } else {
          console.warn('Permiso denegado para mostrar notificaciones.');
        }
      });
    }
  }

  showNotification(title: string, options?: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    } else {
      console.warn('No se pueden mostrar notificaciones debido a falta de permisos.');
    }
  }

  // storage
  public readonly pushNotification = signal<PushNotification | null>(this.storageService.loadFromStorage<PushNotification | null>('pushNotification', null));

  addPushNotification(value: PushNotification) {
    this.storageService.saveToStorage('pushSubscription', value);
    this.pushNotification.set(value);
  }

  updatePushNotification(updates: Partial<PushNotification>) {
    const current = this.pushNotification();
    if (!current) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedUser = {
      ...current,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.pushNotification.set(updatedUser);
    this.storageService.saveToStorage('pushSubscription', updatedUser);
  }

  resetPushNotification() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('pushSubscription');
    }
    this.pushNotification.set(null);
  }


  public readonly userPushNotification = signal<UserPushNotification>(this.storageService.loadFromStorage<UserPushNotification>('userPushNotification', { status: false, webpush: undefined, telegram: undefined }));

  addUserPushNotification(value: UserPushNotification) {
    this.storageService.saveToStorage('userPushNotification', value);
    this.userPushNotification.set(value);
  }

  updateUserPushNotification(updates: Partial<UserPushNotification>) {
    const currentUser = this.userPushNotification();
    if (!currentUser) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedUser = {
      ...currentUser,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.userPushNotification.set(updatedUser);
    this.storageService.saveToStorage('userPushNotification', updatedUser);
  }

  resetUserPushNotification() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('userPushNotification');
    }
    this.userPushNotification.set({ status: false, webpush: undefined, telegram: undefined });
  }

}
