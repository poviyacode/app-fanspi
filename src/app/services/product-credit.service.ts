import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { ProductCredit } from '@interfaces/productCredit';

interface FindAllResponse {
  list: ProductCredit[],
  creditCalculator: any
}

@Injectable({
  providedIn: 'root'
})
export class ProductCreditService {

  private sharedData: any;
  apiUrl = `${environment.api}/product-credit`;

  private http = inject(HttpClient);

  findAll(): Observable<FindAllResponse> {
    return this.http.get<FindAllResponse>(this.apiUrl);
  }

  //-- save product credits
  readonly productCredits = signal<ProductCredit[]>(this.loadFromStorage<ProductCredit[]>('ProductCredit', []));

  addProductCredits(updatedProductCredit: ProductCredit[]) {
    this.saveToStorage('ProductCredit', updatedProductCredit);
    this.productCredits.set(updatedProductCredit);
  }

  resetProductCredits() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('ProductCredit');
    }
    this.productCredits.set([]);
  }

  //--- storage
  public loadFromStorage<T>(storageKey: string, defaultValue: T): T {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const storedData = localStorage.getItem(storageKey);
      return storedData ? JSON.parse(storedData) as T : defaultValue;
    }
    return defaultValue;
  }

  private saveToStorage<T>(storageKey: string, data: T): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }
}
