import { HttpClient } from '@angular/common/http';
import { inject, signal, Service } from '@angular/core';
import { Observable, delay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { Comments, CommentLive } from '@interfaces/comment';

@Service()
export class CommentService {

  apiUrl = `${environment.api}/comment`;

  private http = inject(HttpClient);

  create(data: any): Observable<Comments> {
    return this.http.post<Comments>(this.apiUrl + '/', data, Headers.HttpOptions());
  }

  //------------------ Find All Post
  findAllPost(data: any, limit: number, offset: number): Observable<any> {

    //offset = 1;
    return this.http.post<any>(this.apiUrl + `/find-all-post?limit=${limit}&offset=${offset}`, data)
      ;
  }

  //----------------- End Find All Post

  delete(id: any): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/' + id);
  }

  //-- save coment live
  readonly commentsLive = signal<CommentLive[]>(this.loadFromStorage<CommentLive[]>('commentsLive', []));

  addCommentsLive(updatedComments: CommentLive[]) {
    this.saveToStorage('commentsLive', updatedComments);
    this.commentsLive.set(updatedComments);
  }

  updateCommentsLive(id: string, updates: Partial<CommentLive>) {
    const current = this.loadFromStorage<CommentLive[]>('commentsLive', []);
    const updated = current.map(item =>
      item.ID === id ? { ...item, ...updates } : item
    );

    this.commentsLive.set(updated);
    this.saveToStorage('commentsLive', updated);
  }

  removeCommentsLive(id: string) {
    const currentComments = this.loadFromStorage<CommentLive[]>('commentsLive', [])
    const updatedComments = currentComments.filter(item => item.ID !== id);
    this.saveToStorage('commentsLive', updatedComments);
    this.commentsLive.set(updatedComments);
  }

  resetCommentsLive() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('commentsLive');
    }
    this.commentsLive.set([]);
  }

  //-- save coment 
  readonly comments = signal<Comments[]>(this.loadFromStorage<Comments[]>('comments', []));

  addComments(updatedComments: Comments[]) {
    this.saveToStorage('comments', updatedComments);
    this.comments.set(updatedComments);
  }

  updateComments(id: string, updates: Partial<Comments>) {
    const current = this.loadFromStorage<Comments[]>('comments', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.comments.set(updated);
    this.saveToStorage('comments', updated);
  }

  removeComments(id: string) {
    const currentComments = this.loadFromStorage<Comments[]>('comments', [])
    const updatedComments = currentComments.filter(item => item._id !== id);
    this.saveToStorage('comments', updatedComments);
    this.comments.set(updatedComments);
  }

  resetComments() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('comments');
    }
    this.comments.set([]);
  }

  //--- storage
  public loadFromStorage<T>(storageKey: string, defaultValue: T): T {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const storedData = localStorage.getItem(storageKey);
      return storedData ? JSON.parse(storedData) as T : defaultValue;
    }
    return defaultValue;
  }

  public saveToStorage<T>(storageKey: string, data: T): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }
}
