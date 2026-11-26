import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { ToolsService } from './tools.service';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { catchError, delay, lastValueFrom, of } from 'rxjs';
import { BalanceTransactionCredit, CreditCalculator, TransactionCredit, UserCredit } from '@interfaces/transactionCredit';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionCreditService {

  apiUrl = `${environment.api}/transaction-credit`;

  private http = inject(HttpClient);
  private toolsService = inject(ToolsService);
  private storageService = inject(StorageService);

  update(id: string, data: any): Observable<TransactionCredit> {
    const uri = this.apiUrl + '/' + id;
    return this.http.put<TransactionCredit>(uri, data, Headers.HttpOptions());
  }

  createAdBuy(dataQuery: any): Observable<any> {
    return this.http.post<TransactionCredit>(this.apiUrl + '/create-ad-buy', dataQuery, Headers.HttpOptions());
  }

  createTransfer(data: any): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + '/createTransfer', data, Headers.HttpOptions());
  }

  balanceMoneyUser(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/balanceMoneyUser', data, Headers.HttpOptions());
  }

  withdrawalRequest(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/withdrawalRequest', data, Headers.HttpOptions());
  }

  createSendMoney(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/createSendMoney', data, Headers.HttpOptions());
  }

  // find income live user
  findIncomeTransactionCreditLiveUser(data: any, limit: number, offset: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `/findIncomeTransactionCreditLiveUser?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      ;
  }

  //-- save transaction credits income live user
  readonly transactionCreditsIncomeLiveUser = signal<TransactionCredit[]>(this.storageService.loadFromStorage<TransactionCredit[]>('transactionCreditsIncomeLiveUser', []));

  addTransactionCreditsIncomeLiveUser(updatedTransactionCredits: TransactionCredit[]) {
    this.storageService.saveToStorage('transactionCreditsIncomeLiveUser', updatedTransactionCredits);
    this.transactionCreditsIncomeLiveUser.set(updatedTransactionCredits);
  }

  updateTransactionCreditsIncomeLiveUser(id: string, updates: Partial<TransactionCredit>) {
    const current = this.storageService.loadFromStorage<TransactionCredit[]>('transactionCreditsIncomeLiveUser', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.transactionCreditsIncomeLiveUser.set(updated);
    this.storageService.saveToStorage('transactionCreditsIncomeLiveUser', updated);
  }

  removeTrasactionCreditsIncomeLiveUser(id: string) {
    const currentTransactionCredits = this.storageService.loadFromStorage<TransactionCredit[]>('transactionCreditsIncomeLiveUser', [])
    const updatedTransactionCredits = currentTransactionCredits.filter(item => item._id !== id);
    this.storageService.saveToStorage('transactionCreditsIncomeLiveUser', updatedTransactionCredits);
    this.transactionCreditsIncomeLiveUser.set(updatedTransactionCredits);
  }

  resetTransactionCreditsIncomeLiveUser() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('transactionCreditsIncomeLiveUser');
    }
    this.transactionCreditsIncomeLiveUser.set([]);
  }

  // transaction credit income live user sum
  public readonly transactionCreditIcomeLiveUserSum = signal<any | null>(this.storageService.loadFromStorage<any | null>('transactionCreditIcomeLiveUserSum', null));

  addTransactionCreditIcomeLiveUserSum(value: any) {
    this.storageService.saveToStorage('transactionCreditIcomeLiveUserSum', value);
    this.transactionCreditIcomeLiveUserSum.set(value);
  }

  updateTransactionCreditIcomeLiveUserSum(updates: Partial<any>) {
    const current = this.transactionCreditIcomeLiveUserSum();
    if (!current) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updated = {
      ...current,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.transactionCreditIcomeLiveUserSum.set(updated);
    this.storageService.saveToStorage('transactionCreditIcomeLiveUserSum', updated);
  }

  resetTransactionCreditIcomeLiveUserSum() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('transactionCreditIcomeLiveUserSum');
    }
    this.transactionCreditIcomeLiveUserSum.set(null);
  }

  //-----------------------PAYMENTS
  paymentsTransactionUser(data: any, limit: number, offset: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `/paymentsTransactionUser?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      ;
  }

  paymentsTransactionInfinite(data: any, limit: number, offset: number): Observable<any> {

    return this.http.post<any>(this.apiUrl + `/payments-transaction-user-infinite?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      ;
  }


  paymentsTransactionCounter(data: any): Observable<any> {

    return this.http.post<any>(this.apiUrl + `/payments-transaction-user-counter`, data, Headers.HttpOptions())
      ;
  }

  activityTransactionUser(data: any, limit: number, offset: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `/activityTransactionUser?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions());
  }

  //--------------------------INCOMES---------------------------
  incomeTransaction(data: any, limit: number, offset: number): Observable<any> {

    return this.http.post<any>(this.apiUrl + `/income-transaction-user?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      ;
  }

  incomeTransactionCounter(data: any): Observable<any> {

    return this.http.post<any>(this.apiUrl + `/income-transaction-user-counter`, data, Headers.HttpOptions())
      ;
  }
  //------------------------- END INCOMES------------------------

  //------------------------- INCOMES CAM -----------------------
  incomeTransactionCam(data: any, limit: number, offset: number): Observable<any> {

    return this.http.post<any>(this.apiUrl + `/income-transaction-user-cam?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      ;
  }

  // CREDIT CALCULATOR
  findCreditCalculator(data: any): Promise<CreditCalculator> {
    const url = `${this.apiUrl}/creditCalculator`;
    return lastValueFrom(this.http.post<CreditCalculator>(url, data));
  }

  public creditCalculator = signal<CreditCalculator | null>(
    this.storageService.loadFromStorage<CreditCalculator | null>('creditCalculator', null)
  );

  addCreditCalculator(value: CreditCalculator) {
    this.storageService.saveToStorage('creditCalculator', value);
    this.creditCalculator.set(value);
  }

  // COUNT
  countTransactionCreditUser(userId: string): Observable<UserCredit> {
    return this.http.get<UserCredit>(this.apiUrl + `/countTransactionCreditUser/${userId}`);
  }

  // Balance Transaction Credit
  public balanceTransactionCredit = signal<BalanceTransactionCredit | null>(
    this.storageService.loadFromStorage<BalanceTransactionCredit | null>('balanceTransactionCredit', null)
  );

  addBalanceTransactionCredit(value: BalanceTransactionCredit) {
    this.storageService.saveToStorage('balanceTransactionCredit', value);
    this.balanceTransactionCredit.set(value);
  }

  updateBalanceTransactionCredit(updates: Partial<BalanceTransactionCredit>) {
    const current = this.balanceTransactionCredit();
    if (!current) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updated = {
      ...current,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.balanceTransactionCredit.set(updated);
    this.storageService.saveToStorage('balanceTransactionCredit', updated);
  }

  resetBalanceTransactionCredit() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('balanceTransactionCredit');
    }
    this.balanceTransactionCredit.set(null);
  }

  //-- save transaction credit
  public transactionCredit = signal<TransactionCredit | null>(null);

  addTransaction(value: TransactionCredit) {
    this.transactionCredit.set(value);
  }

  resetTransaction() {
    this.transactionCredit.set(null);
  }

  //-- save transaction credits
  readonly transactionCredits = signal<TransactionCredit[]>(this.storageService.loadFromStorage<TransactionCredit[]>('transactionCredits', []));

  addTransactionCredits(updatedTransactionCredits: TransactionCredit[]) {
    this.storageService.saveToStorage('transactionCredits', updatedTransactionCredits);
    this.transactionCredits.set(updatedTransactionCredits);
  }

  updateTransactionCredits(paymentOrderId: string, updates: Partial<TransactionCredit>) {
    const current = this.storageService.loadFromStorage<TransactionCredit[]>('transactionCredits', []);
    const updated = current.map(item =>
      // Comparamos contra el ID de la PaymentOrder anidada
      item.PaymentOrder?._id === paymentOrderId ? { ...item, ...updates } : item
    );

    this.transactionCredits.set(updated);
    this.storageService.saveToStorage('transactionCredits', updated);
  }

  removeTrasactionCredits(id: string) {
    const currentTransactionCredits = this.storageService.loadFromStorage<TransactionCredit[]>('transactionCredits', [])
    const updatedTransactionCredits = currentTransactionCredits.filter(item => item._id !== id);
    this.storageService.saveToStorage('transactionCredits', updatedTransactionCredits);
    this.transactionCredits.set(updatedTransactionCredits);
  }

  resetTransactionCredits() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('transactionCredits');
    }
    this.transactionCredits.set([]);
  }

}
