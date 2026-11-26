import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { Membership } from '@interfaces/membership';
import { ResponseApi } from '@interfaces/responseApi';
import { StorageService } from './storage.service';

@Service()
export class MembershipService {

  apiUrl = `${environment.api}/membership`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/', data, Headers.HttpOptions());
  }

  updateMembership(data: any): Observable<Membership> {
    return this.http.post<Membership>(this.apiUrl + '/updateMembership', data, Headers.HttpOptions());
  }

  findAllUser(userId: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/findAllUser/' + userId, Headers.HttpOptions());
  }

  findAllUserJoin(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/find-all-user-join', data, Headers.HttpOptions());
  }

  updateDiscount(data: any): Observable<Membership> {
    return this.http.post<Membership>(this.apiUrl + '/updateDiscount', data, Headers.HttpOptions());
  }

  findAll(): Observable<ResponseApi> {
    return this.http.get<ResponseApi>(this.apiUrl);
  }

  findAllCities(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/country-cities');
  }

  delete(id: any): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/' + id);
  }

  seedDefaultLovenseOptions(): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/seedDefaultLovenseOptions', {}, Headers.HttpOptions());
  }

  addToyLovense(data: any): Observable<any> {
    const uri = `${this.apiUrl}/addToyLovense`;
    return this.http.post<any>(uri, data, Headers.HttpOptions());
  }

  readonly memberships = signal<Membership[]>(this.storageService.loadFromStorage<Membership[]>('memberships', []));

  addMemberships(updatedMemberships: Membership[]) {
    this.storageService.saveToStorage('memberships', updatedMemberships);
    this.memberships.set(updatedMemberships);
  }

  updateMemberships(id: string, updates: Partial<Membership>) {
    const current = this.storageService.loadFromStorage<Membership[]>('memberships', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );
    this.memberships.set(updated);
    this.storageService.saveToStorage('memberships', updated);
  }

  removeMemberships(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<Membership[]>('memberships', [])
    const updatedMemberships = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('memberships', updatedMemberships);
    this.memberships.set(updatedMemberships);
  }

  resetMemberships() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('memberships');
    }
    this.memberships.set([]);
  }

}
