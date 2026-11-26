import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, retry, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { PostMedia, PostMediaDetails } from '@interfaces/postMedia';

@Injectable({
  providedIn: 'root'
})
export class PostMediaService {

  apiUrl = `${environment.api}/post-media`;

  private http = inject(HttpClient);

  create(data: any, files: any): Observable<any> {
    const uploadData = new FormData();
    //uploadData.append('files', files[0]);       // una sola imagen

    for (var i = 0; i < files.length; i++) {

      uploadData.append("files", files[i]);       // imagenes multiples
    }
    uploadData.append('Ad', '631a5221e163d2c8924a7992');
    return this.http.post<any[]>(this.apiUrl + '/upload-multiple', uploadData);
  }

  deletePost(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/delete', data, Headers.HttpOptions());
  }

  deleteCover(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/deleteCover', data, Headers.HttpOptions());
  }

  deleteProfile(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/deleteProfile', data, Headers.HttpOptions());
  }

  handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Get client-side error
      errorMessage = error.error.message;
    } else {
      // Get server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    window.alert(errorMessage);
    return throwError(() => {
      return errorMessage;
    });
  }

  // save post medias
  readonly postMedias = signal<PostMedia[]>(this.loadFromStorage<PostMedia[]>('postMedias', []));

  addPostMedias(updates: PostMedia[]) {
    this.saveToStorage('postMedias', updates);
    this.postMedias.set(updates);
  }

  updatePostMedias(id: string, updates: Partial<PostMedia>) {
    const current = this.loadFromStorage<PostMedia[]>('postMedias', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.postMedias.set(updated);
    this.saveToStorage('postMedias', updated);
  }

  removePostMedias(chatId: string) {
    const currentChats = this.loadFromStorage<PostMedia[]>('postMedias', [])
    const updatedChats = currentChats.filter(chat => chat._id !== chatId);
    this.saveToStorage('postMedias', updatedChats);
    this.postMedias.set(updatedChats);
  }

  resetPostMedias() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('postMedias');
    }
    this.postMedias.set([]);
  }

  // save post media
  public readonly postMedia = signal<PostMedia | null>(this.loadFromStorage<PostMedia | null>('postMedia', null));

  addChat(value: PostMedia) {
    this.saveToStorage('postMedia', value);
    this.postMedia.set(value);
  }

  // storage
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

  // funtion
  getBackgroundImageUrl(media: any): PostMediaDetails | null {

    if (!media) return null;

    const { type, cloudflare, url, title, urlSnapshot } = media;
    const alt = title || 'Media content';

    if (type === 'image') {
      return {
        type: 'image',
        url: cloudflare?.result?.variants?.[0] || url,
        alt: alt
      };
    } else if (type === 'video') {

      const gifUrl = cloudflare?.result?.uid
        ? `https://customer-6kruyx7h361tmu11.cloudflarestream.com/${cloudflare.result.uid}/thumbnails/thumbnail.gif?time=1s&height=200&duration=10s`
        : null;

      return {
        type: 'video',
        url: cloudflare?.result?.thumbnail,
        gifUrl: gifUrl!,
        alt: alt || 'Video thumbnail',
        thumbnail: cloudflare?.result?.thumbnail
      };
    } else {
      return null;
    }
  }

}
