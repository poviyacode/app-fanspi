import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  private socket: Socket | undefined;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const usuarioId = localStorage.getItem('usuarioId') || 'anonimo';
      //this.socket = io('http://localhost:5000', {
      this.socket = io('https://api.poviya.com', {
        query: { usuarioId },
        transports: ['websocket'], // recomendado
      });
    }
  }

  onNuevaNotificacion(callback: (data: any) => void) {
    this.socket?.on('nuevaNotificacion', callback);
  }

  desconectar() {
    this.socket?.disconnect();
  }

  solicitarPermisoNotificacion() {
    if (isPlatformBrowser(this.platformId)) {
      if ('Notification' in window) {
        Notification.requestPermission().then((permiso) => {
          console.log('Permiso de notificación:', permiso);
        });
      }
    }
  }

  mostrarNotificacion(titulo: string, mensaje: string) {
    try {
      if (
        isPlatformBrowser(this.platformId) &&
        Notification.permission === 'granted'
      ) {
        console.log('message push');
        const noti = new Notification(titulo, {
          body: mensaje,
          icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827349.png',
        });

        noti.onclick = () => {
          console.log('Notificación clickeada');
          window.focus();
        };
      }
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
    }


    // if (
    //   isPlatformBrowser(this.platformId) &&
    //   Notification.permission === 'granted'
    // ) {
    //   console.log('message push')
    //   new Notification(titulo, {
    //     body: mensaje,
    //     icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827349.png',
    //   });
    // }
  }
}
