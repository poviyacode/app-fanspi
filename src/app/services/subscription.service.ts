import { HttpClient } from '@angular/common/http';
import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { BehaviorSubject, delay, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { Subscription } from '@interfaces/subscription';
import { ResponseList } from '@interfaces/response';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  apiUrl = `${environment.api}/subscription`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  update(id: string, data: any): Observable<Subscription> {
    const uri = this.apiUrl + '/' + id;
    return this.http.patch<Subscription>(uri, data, Headers.HttpOptions());
  }

  findAllUser(data: any): Observable<Subscription[]> {
    data.Site = environment.site;

    return this.http.post<Subscription[]>(this.apiUrl + '/find-all-user', data);
  }

  createSubscribers(data: any): Observable<Subscription> {
    //data.Site = environment.site;

    return this.http.post<Subscription>(this.apiUrl + '/create', data, Headers.HttpOptions());
  }

  createFreeSubscribers(data: any): Observable<Subscription> {
    //data.Site = environment.site;

    return this.http.post<Subscription>(this.apiUrl + '/create-free', data, Headers.HttpOptions());
  }

  findAllSubscriptionsUser(data: any, limit: number, offset: number): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + `/findAllSubscriptionsUser?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      ;
  }

  findAllSubscribersUser(data: any, limit: number, offset: number): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + `/findAllSubscribersUser?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      ;
  }

  //-- save subscription join
  public subscriptionJoin = signal<Subscription | null>(null);
  public readonly userProfile = signal<Subscription | null>(this.storageService.loadFromStorage<Subscription | null>('userProfile', null));

  addSubscriptionJoin(value: Subscription) {
    this.storageService.saveToStorage('subscriptionJoin', value);
    this.subscriptionJoin.set(value);
  }

  resetSubscriptionJoin() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('subscriptionJoin');
    }
    this.subscriptionJoin.set(null);
  }

  // subscribers Uer Join
  readonly subscribersUserJoin: WritableSignal<Subscription[]> = signal<Subscription[]>(this.storageService.loadFromStorage<Subscription[]>('subscribersUserJoin', []));

  addSubscribersUserJoin(value: Subscription[]) {
    this.storageService.saveToStorage('subscribersUserJoin', value);
    this.subscribersUserJoin.set(value);
  }

  searchSubscribersUserJoin(slug: string) {
    const subscriptions = this.subscribersUserJoin();
    if (subscriptions && subscriptions.length > 0) {
      const userSubscription = subscriptions.filter(item => item.Join?.username == slug)[0];
      return userSubscription;
    } else {
      return null;
    }
  }

  resetSubscribersUserJoin() {
    localStorage.removeItem('subscribersUserJoin');
    this.subscribersUserJoin.set([]);
  }

  //-- save subscribers user
  readonly subscribersUser = signal<Subscription[]>(this.storageService.loadFromStorage<Subscription[]>('subscribersUser', []));

  addSubscribersUser(updatedSubscribersUser: Subscription[]) {
    this.storageService.saveToStorage('subscribersUser', updatedSubscribersUser);
    this.subscribersUser.set(updatedSubscribersUser);
  }

  updateSubscribersUser(id: string, updates: Partial<Subscription>) {
    const current = this.storageService.loadFromStorage<Subscription[]>('subscribersUser', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.subscribersUser.set(updated);
    this.storageService.saveToStorage('subscribersUser', updated);
  }

  removeSubscribersUser(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<Subscription[]>('subscribersUser', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('subscribersUser', updatedPosts);
    this.subscribersUser.set(updatedPosts);
  }

  resetSubscribersUser() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('subscribersUser');
    }
    this.subscribersUser.set([]);
  }

}
