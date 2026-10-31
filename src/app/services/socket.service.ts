import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Manager, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  http = inject(HttpClient);

  apiUrl = environment.api;
  apiSocket = environment.apiSocket;

  public socket!: Socket;
  public socketStatus = signal(false);

  /**
   * Centraliza la creación del Socket compartiendo la configuración de reconexión
   */
  socketConnect(accessToken: string | null) {
    // Evitar duplicar conexiones activas
    if (this.socket && this.socket.connected) {
      console.warn('Ya existe una conexión activa.');
      return;
    }

    // Configurar los headers dinámicamente si existe un token
    const transportOptions: any = {};
    if (accessToken) {
      transportOptions.extraHeaders = {
        Authorization: accessToken,
      };
    }

    // Configuración unificada con opciones de reconexión automática
    const manager = new Manager(this.apiSocket, {
      ...transportOptions,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Mantenemos siempre el mismo Namespace asignado ('/socket')
    this.socket = manager.socket('/socket');

    // --- Manejo de Ciclo de Vida del Socket (Unificado) ---
    this.socket.on('connect', () => {
      console.log('¡Socket conectado exitosamente!');
      this.socketStatus.set(true);

      this.socket.emit('request_initial_online_users');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket desconectado por:', reason);
      this.socketStatus.set(false);

      // Si el servidor forzó la desconexión, intentamos reconectar manualmente
      if (reason === 'io server disconnect') {
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión en el Socket:', error);
    });
  }

  /**
   * Método principal de conexión automática
   */
  connect() {
    const rawToken = localStorage.getItem('access_token');
    let accessToken: string | null = null;

    if (rawToken) {
      try {
        accessToken = JSON.parse(rawToken);
      } catch (e) {
        // Por si el token almacenado no es un JSON válido
        accessToken = rawToken;
      }
    } else {
      console.warn('Conectando al socket en modo invitado (Sin access_token).');
    }

    // Llamamos al método unificado pasando el token (o null si no existe)
    this.socketConnect(accessToken);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socketStatus.set(false);
    }
  }

  joinRoom(roomId: string, callback: (response: any) => void): void {
    if (this.socket) {
      this.socket.emit('joinRoom', roomId, (response: any) => {
        callback(response);
      });
    }
  }

  leaveRoom(roomId: string, callback: (response: any) => void): void {
    if (this.socket) {
      this.socket.emit('leaveRoom', roomId, (response: any) => {
        callback(response);
      });
    }
  }

  /**
   * Permite escuchar eventos controlando de manera segura si el socket está inicializado
   */
  listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      if (!this.socket) {
        subscriber.error('El socket no ha sido inicializado. Llama a connect() primero.');
        return;
      }

      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      });

      // Limpieza automática cuando el componente de Angular se destruya / desuscriba
      return () => {
        this.socket.off(eventName);
      };
    });
  }
}