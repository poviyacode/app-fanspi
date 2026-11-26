import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, catchError, delay, lastValueFrom, Observable, retry, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { Post } from '@interfaces/post';
import { PostMedia } from '@interfaces/postMedia';
import { isPlatformServer } from '@angular/common';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  apiUrl = `${environment.api}/post`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private authService = inject(AuthService);
  private readonly MAX_POSTS = 50;

  constructor() {
    if (!Headers.HttpOptions()) {
      this.authService.logout();
    }
  }

  upload(data: any, files: any): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    for (var i = 0; i < files.length; i++) {
      console.log('files', files[i]);
      formData.append("files", files[i]);       // imagenes multiples
    }
    formData.append('files', files);
    formData.append('data', JSON.stringify(data));

    const req = new HttpRequest('POST', `${this.apiUrl}/create`, formData, {
      reportProgress: true,
      responseType: 'json',
    });
    return this.http.request(req);
  }

  create(data: any): Observable<Post> {
    data.Site = this.authService.user()?.Site?._id;
    return this.http.post<Post>(this.apiUrl + '/create', data, Headers.HttpOptions())
      ;
  }

  createPostNotification(data: any, userId: string): Promise<any> {
    return lastValueFrom(this.http.post<any>(this.apiUrl + `/createPostNotification/${userId}`, data));
  }

  update(id: string, data: any): Observable<Post> {
    const uri = this.apiUrl + '/' + id;
    return this.http.put<Post>(uri, data, Headers.HttpOptions());
  }

  updateField(id: string, data: any): Observable<Post> {
    const uri = this.apiUrl + '/updateField/' + id;
    return this.http.put<Post>(uri, data);
  }

  updatePined(id: string, data: any): Observable<Post> {
    const uri = this.apiUrl + '/pined/' + id;
    return this.http.put<Post>(uri, data, Headers.HttpOptions());
  }

  likes(id: string, data: any): Observable<Post> {
    const uri = this.apiUrl + '/like/' + id;
    return this.http.put<Post>(uri, data, Headers.HttpOptions());
  }

  //------------------ Find All Users
  findAllUser(data: any, limit: number, offset: number): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + `/findAllUser?limit=${limit}&offset=${offset}`, data)
      .pipe();
  }

  //------------------ post media
  findAllUserMedia(data: any, limit: number, offset: number): Observable<any> {

    //offset = 1;
    return this.http.post<PostMedia[]>(this.apiUrl + `/findAllUserMedia?limit=${limit}&offset=${offset}`, data)
      ;
  }

  //------------------ recent user media
  findRecentUserMedia(data: any, limit: number, offset: number): Observable<any> {

    //offset = 1;
    return this.http.post<PostMedia[]>(this.apiUrl + `/findRecentUserMedia?limit=${limit}&offset=${offset}`, data)
      ;
  }

  findOne(id: any): Observable<Post> {
    return this.http
      .get<Post>(this.apiUrl + '/' + id);
    //.pipe(retry(1), catchError(this.handleError));
  }

  findOneSlug(data: any): Observable<any> {
    data.Site = environment.site;
    return this.http.post<Post>(this.apiUrl + '/slug', data);
  }

  findAllPosts(data: any, limit: number, offset: number): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + `/findAllPosts?limit=${limit}&offset=${offset}`, data)
      .pipe();
  }

  postsFindAll: Post[] = [];

  addFindAll(posts: Post[]) {
    this.postsFindAll = posts;
  }

  getFindAll() {
    return this.postsFindAll;
  }

  // litst post explore*/
  findAllExplore(data: any, limit: number, offset: number): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + `/findAllExplorePosts?limit=${limit}&offset=${offset}`, data)
      ;
  }

  //********** litst post explore*/

  findAllSearchPosts(data: any, limit: number, offset: number): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + `/findAllSearchPosts?limit=${limit}&offset=${offset}`, data)
      ;
  }

  findAllSearchPostsUser(data: any, limit: number, offset: number): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + `/findAllSearchPostsUser?limit=${limit}&offset=${offset}`, data)
      ;
  }

  delete(id: any): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/' + id, Headers.HttpOptions());
  }

  findRecentPhotosUser(id: any): Observable<PostMedia[]> {
    return this.http
      .get<PostMedia[]>(this.apiUrl + '/' + id);
    //.pipe(retry(1), catchError(this.handleError));
  }

  latestPost(data: any): Observable<Post> {
    return this.http.post<Post>(this.apiUrl + '/latestPost', data);
  }

  updateView(data: any): Observable<Post> {
    return this.http.post<Post>(this.apiUrl + '/updateView', data);
  }


  searchPosts(data: any): Observable<any> {

    return this.http.post<any>(this.apiUrl + '/search-posts', data);
  }

  removeDuplicatePosts(posts: Post[]): Post[] {
    const uniquePosts: { [id: string]: Post } = {};

    posts.forEach((post) => {
      uniquePosts[post._id!] = post;
    });

    return Object.values(uniquePosts);
  }

  //-- save search posts
  readonly postsSearch = signal<Post[]>(this.storageService.loadFromStorage<Post[]>('postsSearch', []));

  addPostsSearch(updatedPosts: Post[]) {
    this.storageService.saveToStorage('postsSearch', updatedPosts);
    this.postsSearch.set(updatedPosts);
  }

  updatePostsSearch(id: string, updates: Partial<Post>) {
    const current = this.storageService.loadFromStorage<Post[]>('postsSearch', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.postsSearch.set(updated);
    this.storageService.saveToStorage('postsSearch', updated);
  }

  removePostsSearch(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<Post[]>('postsSearch', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('postsSearch', updatedPosts);
    this.postsSearch.set(updatedPosts);
  }

  resetPostsSearch() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('postsSearch');
    }
    this.postsSearch.set([]);
  }

  //-- save posts
  readonly posts = signal<Post[]>(this.storageService.loadFromStorage<Post[]>('posts', []));

  addPosts(updatedPosts: Post[]) {
    //const limitedPosts = this.removeOldestPosts(updatedPosts);
    this.storageService.saveToStorage('posts', updatedPosts);
    this.posts.set(updatedPosts);
    //this.posts.set(limitedPosts);
  }

  updatePosts(id: string, updates: Partial<Post>) {
    const current = this.storageService.loadFromStorage<Post[]>('posts', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.posts.set(updated);
    this.storageService.saveToStorage('posts', updated);
  }

  removePosts(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<Post[]>('posts', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('posts', updatedPosts);
    this.posts.set(updatedPosts);
  }

  removeOldestPosts(posts: Post[]): Post[] {
    if (posts.length > 0 && posts.length % this.MAX_POSTS === 0) {
      this.resetPosts();
      return posts.slice(20);
    }
    return posts;
  }

  resetPosts() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('posts');
    }
    this.posts.set([]);
  }

  //-- save posts ad
  readonly postAds = signal<Post[]>(this.storageService.loadFromStorage<Post[]>('postAds', []));

  addPostAds(updatedPosts: Post[]) {
    //const limitedPosts = this.removeOldestPosts(updatedPosts);
    this.storageService.saveToStorage('postAds', updatedPosts);
    this.postAds.set(updatedPosts);
    //this.posts.set(limitedPosts);
  }

  updatePostAds(id: string, updates: Partial<Post>) {
    const current = this.storageService.loadFromStorage<Post[]>('postAds', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.postAds.set(updated);
    this.storageService.saveToStorage('postAds', updated);
  }

  removePostAds(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<Post[]>('postAds', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('postAds', updatedPosts);
    this.postAds.set(updatedPosts);
  }

  removeOldestPostAds(posts: Post[]): Post[] {
    if (posts.length > 0 && posts.length % this.MAX_POSTS === 0) {
      this.resetPosts();
      return posts.slice(20);
    }
    return posts;
  }

  resetPostAds() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('postAds');
    }
    this.postAds.set([]);
  }

  //-- save posts ad user
  readonly postAdsUser = signal<Post[]>(this.storageService.loadFromStorage<Post[]>('postAdsUser', []));

  addPostAdsUser(updatedPosts: Post[]) {
    //const limitedPosts = this.removeOldestPosts(updatedPosts);
    this.storageService.saveToStorage('postAdsUser', updatedPosts);
    this.postAdsUser.set(updatedPosts);
    //this.posts.set(limitedPosts);
  }

  updatePostAdsUser(id: string, updates: Partial<Post>) {
    const current = this.storageService.loadFromStorage<Post[]>('postAdsUser', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.postAdsUser.set(updated);
    this.storageService.saveToStorage('postAdsUser', updated);
  }

  removePostAdsUser(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<Post[]>('postAdsUser', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('postAdsUser', updatedPosts);
    this.postAdsUser.set(updatedPosts);
  }

  removeOldestPostAdsUser(posts: Post[]): Post[] {
    if (posts.length > 0 && posts.length % this.MAX_POSTS === 0) {
      this.resetPosts();
      return posts.slice(20);
    }
    return posts;
  }

  resetPostAdsUser() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('postAdsUser');
    }
    this.postAdsUser.set([]);
  }

  //-- save posts swiping
  readonly postsSwiping = signal<Post[]>(this.storageService.loadFromStorage<Post[]>('postsSwiping', []));

  addPostsSwiping(updatedPosts: Post[]) {
    this.storageService.saveToStorage('postsSwiping', updatedPosts);
    this.postsSwiping.set(updatedPosts);
  }

  updatePostsSwiping(id: string, updates: Partial<Post>) {
    const current = this.storageService.loadFromStorage<Post[]>('postsSwiping', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.postsSwiping.set(updated);
    this.storageService.saveToStorage('postsSwiping', updated);
  }

  removePostsSwiping(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<Post[]>('postsSwiping', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('postsSwiping', updatedPosts);
    this.postsSwiping.set(updatedPosts);
  }

  resetPostsSwiping() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('postsSwiping');
    }
    this.postsSwiping.set([]);
  }

  //-- save posts user
  readonly postsUser = signal<Post[]>(this.storageService.loadFromStorage<Post[]>('postsUser', []));

  addPostsUser(updatedPosts: Post[]) {
    this.storageService.saveToStorage('postsUser', updatedPosts);
    this.postsUser.set(updatedPosts);
  }

  updatePostsUser(id: string, updates: Partial<Post>) {
    const current = this.storageService.loadFromStorage<Post[]>('postsUser', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.postsUser.set(updated);
    this.storageService.saveToStorage('postsUser', updated);
  }

  removePostsUser(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<Post[]>('postsUser', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('postsUser', updatedPosts);
    this.postsUser.set(updatedPosts);
  }

  resetPostsUser() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('postsUser');
    }
    this.postsUser.set([]);
  }

  //-- save post

  public readonly post = signal<Post | null>(this.storageService.loadFromStorage<Post | null>('post', null));

  addPost(value: Post) {
    this.storageService.saveToStorage('post', value);
    this.post.set(value);
  }

  updatePost(updates: Partial<Post>) {
    const currentPost = this.post();
    if (!currentPost) return; // Si no hay post, salir

    // Combinar los cambios con el post actual
    const updatedPost = {
      ...currentPost,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.post.set(updatedPost);
    this.storageService.saveToStorage('post', updatedPost);
  }

  resetPost() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('post');
    }
    this.post.set(null);
  }

  // comment count
  updateCommentCount(postId: string, newCount: number) {
    const currentPosts = this.posts();
    const updatedPosts = currentPosts.map(post =>
      post._id === postId ? { ...post, commentCount: newCount } : post
    );
    this.posts.set(updatedPosts);
  }

  // coun post profile 
  public countPostsProfile = signal<any>(null);

  resetCountPostsProfile() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      //localStorage.removeItem('posts');
    }
    this.countPostsProfile.set(null);
  }

  addCountCountPostsProfile(value: any) {
    this.countPostsProfile.set(value);
  }

  calculateDaysDifference(currentSubscriptionDate: any, expirationDate: any): number {
    // Convertir currentSubscriptionDate a timestamp
    const currentTimestamp = new Date(currentSubscriptionDate).getTime();

    // Obtener expirationDate (ya está en milisegundos)
    const expirationTimestamp = expirationDate || 0;

    // Calcular la diferencia en milisegundos
    const differenceInMilliseconds = expirationTimestamp - currentTimestamp;

    // Convertir la diferencia a días
    const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);

    return Math.floor(differenceInDays); // Redondear hacia abajo
  }

}
