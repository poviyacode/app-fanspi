import { HttpClient } from '@angular/common/http';
import { Service, signal, inject, computed, Signal } from '@angular/core';
import { delay, lastValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { User } from '@interfaces/user';
import { StorageService } from './storage.service';
import { Interaction } from '@interfaces/interaction';

@Service()
export class InteractionService {

  apiUrl = `${environment.api}/interaction`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  create(data: any): Observable<Interaction> {
    return this.http.post<Interaction>(this.apiUrl + '/', data, Headers.HttpOptions());
  }

  getSuggestions(): Promise<User[]> {
    return lastValueFrom(this.http.get<User[]>(this.apiUrl + '/getSuggestions/', Headers.HttpOptions()));
  }

  // SIGNAL
  // save userSuggestions
  readonly userSuggestions = signal<User[]>(this.storageService.loadFromStorage<User[]>('userSuggestions', []));

  getUserSuggestions() {
    return this.userSuggestions.asReadonly();
  }

  addUserSuggestions(updatedItems: User[]) {
    this.storageService.saveToStorage('userSuggestions', updatedItems);
    this.userSuggestions.set(updatedItems);
  }

  updateUserSuggestions(id: string, updates: Partial<User>) {
    const current = this.storageService.loadFromStorage<User[]>('userSuggestions', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.userSuggestions.set(updated);
    this.storageService.saveToStorage('userSuggestions', updated);
  }

  removeUserSuggestions(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<User[]>('userSuggestions', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('userSuggestions', updatedPosts);
    this.userSuggestions.set(updatedPosts);
  }

  resetUserSuggestions() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('usersProfile');
    }
    this.userSuggestions.set([]);
  }
}
