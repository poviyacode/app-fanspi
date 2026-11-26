import { inject, Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { User } from '@interfaces/user';
import { Tip } from '@interfaces/tip';

@Injectable({
  providedIn: 'root'
})
export class TipService {

  private storageService = inject(StorageService);

  public readonly tip = signal<Tip | null>(this.storageService.loadFromStorage<Tip | null>('tip', null));

  addTip(value: Tip) {
    this.storageService.saveToStorage('tip', value);
    this.tip.set(value);
  }

  updateTip(updates: Partial<Tip>) {
    const currentUser = this.tip();
    if (!currentUser) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedUser = {
      ...currentUser,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.tip.set(updatedUser);
    this.storageService.saveToStorage('tip', updatedUser);
  }

  resetTip() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('tip');
    }
    this.tip.set(null);
  }
}
