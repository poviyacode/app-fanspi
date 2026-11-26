import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { Bookmark } from '@interfaces/bookmark';
import { StorageService } from './storage.service';

@Service()
export class FollowService {

  apiUrl = `${environment.api}/follow`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  followUser(data: any): Observable<boolean> {
    return this.http.post<boolean>(this.apiUrl + '/followUser', data, Headers.HttpOptions());
  }

  unfollowUser(data: any): Observable<boolean> {
    return this.http.post<boolean>(this.apiUrl + '/unfollowUser', data, Headers.HttpOptions());
  }

  gainFollowers(data: any, userId: string): Observable<any> {
    return this.http.post<any[]>(this.apiUrl + `/gainFollowers/${userId}`, data, Headers.HttpOptions());
  }

  followers(userId: any, limit: number, offset: number): Observable<any> {
    return this.http.get<any[]>(this.apiUrl + `/followers/${userId}?limit=${limit}&offset=${offset}`, Headers.HttpOptions());
  }

  following(userId: any, limit: number, offset: number): Observable<any> {
    return this.http.get<any[]>(this.apiUrl + `/following/${userId}?limit=${limit}&offset=${offset}`, Headers.HttpOptions());
  }

  getFollowersSendEmail(data: any, userId: string): Observable<any> {
    return this.http.post<any>(this.apiUrl + `/getFollowersSendEmail/${userId}`, data);
  }

  //-- save bookmarks
  readonly bookmarks = signal<Bookmark[]>(this.storageService.loadFromStorage<Bookmark[]>('bookmarks', []));

  addBookmarks(updatedPosts: Bookmark[]) {
    this.storageService.saveToStorage('bookmarks', updatedPosts);
    this.bookmarks.set(updatedPosts);
  }

  updateBookmarks(id: string, updates: Partial<Bookmark>) {
    const current = this.storageService.loadFromStorage<Bookmark[]>('bookmarks', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.bookmarks.set(updated);
    this.storageService.saveToStorage('bookmarks', updated);
  }

  removeBookmarks(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<Bookmark[]>('bookmarks', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('bookmarks', updatedPosts);
    this.bookmarks.set(updatedPosts);
  }

  resetBookmarks() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('bookmarks');
    }
    this.bookmarks.set([]);
  }
}
