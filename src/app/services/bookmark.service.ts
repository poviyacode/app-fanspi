import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { Bookmark } from '@interfaces/bookmark';
import { StorageService } from './storage.service';

@Service()
export class BookmarkService {

  apiUrl = `${environment.api}/bookmark`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  create(data: any): Observable<Bookmark> {

    return this.http.post<Bookmark>(this.apiUrl + '/', data, Headers.HttpOptions());
  }

  deleteUser(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/deleteUser', data, Headers.HttpOptions());
  }

  findOneUser(data: any): Observable<Bookmark> {

    return this.http.post<Bookmark>(this.apiUrl + '/find-one-user', data);
  }

  findAllUser(dataQuery: any, limit: number, offset: number): Observable<any> {
    return this.http.post<Bookmark[]>(this.apiUrl + `/findAllUser?limit=${limit}&offset=${offset}`, dataQuery, Headers.HttpOptions());
  }

  delete(id: any): Observable<object> {
    return this.http.delete<Bookmark[]>(this.apiUrl + '/' + id);
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
