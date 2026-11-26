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

  onIncomingCall(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('incoming_call', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('incoming_call');
      };
    });
  }

  onCallRejectedByAudience(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('call_rejected_by_audience', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('call_rejected_by_audience');
      };
    });
  }

  onCallCanceledByTransmiter(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('call_canceled_by_transmiter', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('call_canceled_by_transmiter');
      };
    });
  }

  onUserJoinedCall(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('user_joined_call', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('user_joined_call');
      };
    });
  }

  onTipReceived(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('tip_received', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('tip_received');
      };
    });
  }

  onInitialOnlineUsers(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('initial_online_users', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('initial_online_users');
      };
    });
  }

  onUserOnlineStatus(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('user_online_status', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('user_online_status');
      };
    });
  }

  onLiveStreamStatus(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('live_stream_status', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('live_stream_status');
      };
    });
  }

  // message services
  onNewMessage(): Observable<any> {
    return new Observable((subscriber) => {

      // 1. Creamos la función de callback de manera explícita
      const callback = (data: any) => {
        subscriber.next(data);
      };

      // 2. Registramos esta función específica en el socket
      this.socket.on('new_message', callback);

      // 3. Al destruir el componente, eliminamos ÚNICAMENTE esta función
      // El Sidebar, al tener su propia función callback registrada, seguirá vivo e intacto.
      return () => {
        this.socket.off('new_message', callback);
      };
    });
  }
  onMessageRead(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('message_read', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('message_read');
      };
    });
  }

  onMessageRead2(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('message_read2', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('message_read2');
      };
    });
  }

  onMessageSent(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('message_sent', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('message_sent');
      };
    });
  }

  onMessageDeleted(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('message_deleted', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('message_deleted');
      };
    });
  }

  onSocketTest(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('socket_test', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('socket_test');
      };
    });
  }

  onTypingStatusReceived(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('message:typing_status_received', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('message:typing_status_received');
      };
    });
  }

  // taximeter services
  onTaximeterRunOut(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('message:taximeterRunOut', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('message:taximeterRunOut');
      };
    });
  }

  onTaximeterBilled(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('message:taximeterBilled', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('message:taximeterBilled');
      };
    });
  }

  onTaximeterPaused(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('message:taximeterPaused', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('message:taximeterPaused');
      };
    });
  }

  onTaximeterGracePeriod(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('message:taximeterGracePeriod', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('message:taximeterGracePeriod');
      };
    });
  }

  // transaction credit services
  onCreditUpdate(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('transaction_credit:creditUpdated', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('transaction_credit:creditUpdated');
      };
    });
  }

  onNotifyReceiveNotification(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('notify:receiveNotification', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('notify:receiveNotification');
      };
    });
  }

  onLovenseDeviceConnectedStatus(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('lovense:deviceConnectedStatus', (data: any) => {
        subscriber.next(data);
      });

      // Buena práctica: Limpiar el event listener si el componente se destruye
      return () => {
        this.socket.off('lovense:deviceConnectedStatus');
      };
    });
  }

  onUserSync(): Observable<{ entity: string; action: string; payload: any }> {
    return new Observable((subscriber) => {
      this.socket.on('user:sync', (data) => {
        subscriber.next(data);
      });

      return () => {
        this.socket.off('user:sync');
      };
    });
  }

  onRoomSync(roomId: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(roomId, (data: any) => {
        subscriber.next(data);
      });

      return () => {
        this.socket.off(roomId);
      };
    });
  }

  onSystemSync(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('system:sync', (data: any) => {
        subscriber.next(data);
      });

      return () => {
        this.socket.off('system:sync');
      };
    });
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

  // --- Nuevos métodos para la gestión de creadoras en el admin ---
  emitSetManagedCreators(creatorIds: string[]): void {
    if (this.socket) {
      this.socket.emit('admin_set_managed_creators', { creatorIds });
    }
  }

  onInitialOnlineCreators(): Observable<any[]> {
    return new Observable((subscriber) => {
      this.socket.on('initial_online_creators', (data: any[]) => {
        subscriber.next(data);
      });
      return () => {
        this.socket.off('initial_online_creators');
      };
    });
  }

  onManagedCreatorsConfirmed(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('managed_creators_confirmed', (data: any) => {
        subscriber.next(data);
      });
      return () => {
        this.socket.off('managed_creators_confirmed');
      };
    });
  }
}