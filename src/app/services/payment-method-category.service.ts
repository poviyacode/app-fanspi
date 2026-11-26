import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { ToolsService } from './tools.service';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { AuthService } from './auth.service';
import { ResponsePaymentMethodCategory, PaymentMethodCategory } from '@interfaces/paymentMethodCategory';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodCategoryService {

  paymentMethod: PaymentMethodCategory[];

  apiUrl = `${environment.api}/payment-method-category`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);


  findAll(data: any): Observable<ResponsePaymentMethodCategory> {
    return this.http.post<ResponsePaymentMethodCategory>(this.apiUrl + '/findAll', data, Headers.HttpOptions());
  }

  //-- save user transfer
  public paymentMethodCategory = signal<PaymentMethodCategory | null>(null);

  addPaymentMethodCategory(value: PaymentMethodCategory) {
    this.paymentMethodCategory.set(value);
  }

  resetPaymentMethodCategory() {
    this.paymentMethodCategory.set(null);
  }

  //-- save user transfers
  readonly paymentMethodCategories = signal<PaymentMethodCategory[]>(this.storageService.loadFromStorage<PaymentMethodCategory[]>('paymentMethodCategories', []));

  addPaymentMethodCategories(updatedPosts: PaymentMethodCategory[]) {
    this.storageService.saveToStorage('paymentMethodCategories', updatedPosts);
    this.paymentMethodCategories.set(updatedPosts);
  }

  updatePaymentMethodCategories(id: string, updates: Partial<PaymentMethodCategory>) {
    const current = this.storageService.loadFromStorage<PaymentMethodCategory[]>('paymentMethodCategories', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.paymentMethodCategories.set(updated);
    this.storageService.saveToStorage('paymentMethodCategories', updated);
  }

  removePaymentMethodCategories(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<PaymentMethodCategory[]>('paymentMethodCategories', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('paymentMethodCategories', updatedPosts);
    this.paymentMethodCategories.set(updatedPosts);
  }

  resetPaymentMethodCategories() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('paymentMethodCategories');
    }
    this.paymentMethodCategories.set([]);
  }

}
