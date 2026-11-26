import { inject, Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { SoundService } from './sound.service';

export enum TypeNotification {
  ONLINE = 'ONLINE',
  MESSAGE = 'MESSAGE',
  STREAMING = 'STREAMING',
  VIDEOCALL = 'VIDEOCALL',
  SOUND_RECEIVED = 'SOUND_RECEIVED',
  P2P_REQUEST = 'P2P_REQUEST',
}

export interface Notification {
  _id?: string;
  title?: string;
  body?: string;
  icon?: string;
  timestamp?: number;
  actions?: { action: string; title: string }[];
  type?: TypeNotification;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  public notifications = signal<Notification[]>([]);
  public soundService = inject(SoundService);

  getNotifications() {
    return this.notifications.asReadonly();
  }

  addNotification(notification: Notification) {
    // 1. Generar un ID único robusto si no viene (evita colisiones por milisegundos)
    const notificationId = notification._id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newNotification = { ...notification, _id: notificationId };

    let isNewNotification = false;

    this.notifications.update((current) => {
      // 2. Verificar si YA existe (por ID o por contenido exacto para mayor seguridad)
      const isDuplicate = current.some(n =>
        n._id === newNotification._id ||
        (n.title === newNotification.title && n.body === newNotification.body && n.type === newNotification.type)
      );

      if (isDuplicate) {
        // Es un duplicado: no hacemos nada, retornamos el estado actual.
        // Esto evita que se agregue y, lo más importante, que suene de nuevo.
        return current;
      }

      // Si llegamos aquí, es una notificación genuinamente nueva
      isNewNotification = true;

      // 3. Filtrar por ID (por seguridad) y limitar a 5
      const filtered = current.filter((n) => n._id !== newNotification._id);

      if (filtered.length >= 5) {
        filtered.shift(); // Eliminar la más antigua
      }

      // 4. Agregar la nueva notificación
      return [...filtered, newNotification];
    });

    // 5. ✅ Reproducir sonido SOLO si se confirmó que es una notificación nueva
    if (isNewNotification) {
      this.playSoundByType(newNotification.type);
    }

    // Eliminar la notificación automáticamente después de 5 segundos
    setTimeout(() => {
      this.removeNotification(newNotification._id!);
    }, 5000);
  }

  private playSoundByType(type?: TypeNotification) {
    switch (type) {
      case TypeNotification.ONLINE:
        this.soundService.playSoundNotificationOnline();
        break;
      case TypeNotification.MESSAGE:
        this.soundService.playSoundMessage();
        break;
      case TypeNotification.STREAMING:
        this.soundService.playSoundStreaming();
        break;
      case TypeNotification.VIDEOCALL:
        this.soundService.playSoundVideocall();
        break;
      case TypeNotification.P2P_REQUEST:
        this.soundService.playSoundP2pRequest();
        break;
      default:
        break;
    }
  }

  removeNotification(id: string) {
    this.notifications.update((current) =>
      current.filter((n) => n._id !== id)
    );
  }
}