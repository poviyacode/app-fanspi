import { Injectable } from '@angular/core';
import { WritableSignal, signal } from '@angular/core';

export interface Message {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public toast = signal<Message | null>(null);
  private timeoutHandle: any;

  start(message: Message | null, duration = 3000) {
    this.toast.set(message);

    // Limpiar cualquier timeout previo para evitar comportamientos inesperados
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }

    // Ocultar automáticamente después de `duration` ms
    if (message) {
      this.timeoutHandle = setTimeout(() => {
        this.toast.set(null);
      }, duration);
    }
  }
}
