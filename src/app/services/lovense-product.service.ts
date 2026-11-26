import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, delay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { LovenseProduct } from '@interfaces/lovenseProduct';
import { StorageService } from './storage.service';
import { CommentLive } from '@interfaces/comment';

@Service()
export class LovenseProductService {

  apiUrl = `${environment.api}/lovense-product`;

  private http = inject(HttpClient);
  storageService: StorageService = inject(StorageService);

  //-- save lovense product
  readonly lovenseProducts = signal<LovenseProduct[]>(this.storageService.loadFromStorage<LovenseProduct[]>('lovense-products', []));

  addLovenseProducts(updatedProducts: LovenseProduct[]) {
    this.storageService.saveToStorage('lovense-products', updatedProducts);
    this.lovenseProducts.set(updatedProducts);
  }

  updateLovenseProducts(id: string, updates: Partial<LovenseProduct>) {
    const current = this.storageService.loadFromStorage<LovenseProduct[]>('lovense-products', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.lovenseProducts.set(updated);
    this.storageService.saveToStorage('lovense-products', updated);
  }

  removeLovenseProducts(id: string) {
    const currentProducts = this.storageService.loadFromStorage<LovenseProduct[]>('lovense-products', [])
    const updatedProducts = currentProducts.filter(item => item._id !== id);
    this.storageService.saveToStorage('lovense-products', updatedProducts);
    this.lovenseProducts.set(updatedProducts);
  }

  resetLovenseProducts() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('lovense-products');
    }
    this.lovenseProducts.set([]);
  }
}
