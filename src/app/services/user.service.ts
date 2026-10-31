import { HttpClient } from "@angular/common/http";
import { Injectable, signal, inject } from "@angular/core";
import { BehaviorSubject, catchError, delay, from, lastValueFrom, map, Observable, retry, tap, throwError } from "rxjs";
import { environment } from "../../environments/environment";
import { Headers } from '../core/common/http-headers';
import { ErrorHandlerService } from "./errorHandler.service";
import { Router } from "@angular/router";
import { User, UserCurrent, UserVideoCallRequest } from "@interfaces/user";
import { StorageService } from "./storage.service";
import { ResponseApi } from "@interfaces/responseApi";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  apiUrl = `${environment.api}/user`;

  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private storageService = inject(StorageService);

  profile(data: any): Observable<any> {

    return this.http.post<any[]>(this.apiUrl + '/createProfile', data, Headers.HttpOptions());
  }

  createPersonal(data: any): Observable<any> {
    return this.http.post<any[]>(this.apiUrl + '/createPersonal', data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  update(id: any, data: any): Observable<User> {
    return this.http
      .put<User>(this.apiUrl + '/' + id, data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  updateRoles(id: string, data: any): Observable<User> {
    return this.http.patch<User>(this.apiUrl + '/roles/' + id, data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  verifiedAccount(data: any): Observable<User> {
    return this.http.post<User>(this.apiUrl + '/verifiedAccount', data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  verifyEmail(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/verifyEmail', data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  slug(data: any) {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + '/slug', data)
      .pipe(delay(200));
  }

  updateUsername(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/updateUsername', data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  updateEmail(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/updateEmail', data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  findOne(id: any): Observable<User> {
    return this.http
      .get<User>(this.apiUrl + '/' + id)
      .pipe(delay(200));
  }

  findOneCurrent(id: any): Promise<UserCurrent> {
    return lastValueFrom(this.http.get<UserCurrent>(this.apiUrl + '/findOneCurrent/' + id)
      .pipe(delay(200)));
  }

  findOneCamRom(id: any): Observable<User> {
    return this.http
      .get<User>(this.apiUrl + '/camRomId/' + id)
      .pipe(delay(200));
  }

  userProfiles(data: any, limit: number, offset: number): Observable<ResponseApi> {
    data.Site = environment.site;
    return this.http.post<ResponseApi>(this.apiUrl + `/userProfiles?limit=${limit}&offset=${offset}`, data)
      .pipe(delay(200));
  }

  searchUsers(data: any, limit: number, offset: number): Observable<ResponseApi> {
    data.Site = environment.site;
    return this.http.post<ResponseApi>(this.apiUrl + `/searchUsers?limit=${limit}&offset=${offset}`, data)
      .pipe(delay(200));
  }

  // suggested users
  findSuggestedUsers(data: any): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + '/usersSuggestion', data)
      .pipe(delay(200));
  }

  readonly suggestedUsers = signal<User[]>(this.storageService.loadFromStorage<User[]>('suggestedUsers', []));

  addSuggestedUsers(value: User[]) {
    this.storageService.saveToStorage('suggestedUsers', value);
    this.suggestedUsers.set(value);
  }

  //--- find live
  findUsersLive(data: any, limit: number, offset: number): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + `/findUsersLive?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  //--- find online
  findUsersOnline(data: any, limit: number, offset: number): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + `/findUsersOnline?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  //find explore
  findAllUsersExplore(data: any, limit: number, offset: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `/findAllUsersExplore?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  //  find one personal
  findOnePersonal(id: any): Observable<User> {
    return this.http.get<User>(this.apiUrl + '/personal/' + id).pipe(delay(200));
  }

  //  find all marketing
  findAllEmailMarketing(data: any): Observable<User[]> {
    return this.http.post<User[]>(this.apiUrl + `/findAllEmailMarketing`, data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  //--- signals
  public readonly userProfile = signal<User | null>(this.storageService.loadFromStorage<User | null>('userProfile', null));

  addUserProfile(value: User) {
    this.storageService.saveToStorage('userProfile', value);
    this.userProfile.set(value);
  }

  updateUserProfile(updates: Partial<User>) {
    const currentUser = this.userProfile();
    if (!currentUser) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedUser = {
      ...currentUser,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.userProfile.set(updatedUser);
    this.storageService.saveToStorage('userProfile', updatedUser);
  }

  resetUserProfile() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('userProfile');
    }
    this.userProfile.set(null);
  }

  //-- save users online
  readonly usersOnline = signal<User[]>(this.storageService.loadFromStorage<User[]>('usersOnline', []));

  addUsersOnline(updatedItems: User[]) {
    this.storageService.saveToStorage('usersOnline', updatedItems);
    this.usersOnline.set(updatedItems);
  }

  updateUsersOnline(id: string, updates: Partial<User>) {
    const current = this.storageService.loadFromStorage<User[]>('usersOnline', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.usersOnline.set(updated);
    this.storageService.saveToStorage('usersOnline', updated);
  }

  removeUsersOnline(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<User[]>('usersOnline', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('usersOnline', updatedPosts);
    this.usersOnline.set(updatedPosts);
  }

  resetUsersOnline() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('usersOnline');
    }
    this.usersOnline.set([]);
  }

  //-- save users live
  readonly usersLive = signal<User[]>(this.storageService.loadFromStorage<User[]>('usersLive', []));

  addUsersLive(updatedItems: User[]) {
    this.storageService.saveToStorage('usersLive', updatedItems);
    this.usersLive.set(updatedItems);
  }

  updateUsersLive(id: string, updates: Partial<User>) {
    const current = this.storageService.loadFromStorage<User[]>('usersLive', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.usersLive.set(updated);
    this.storageService.saveToStorage('usersLive', updated);
  }

  removeUsersLive(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<User[]>('usersLive', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('usersLive', updatedPosts);
    this.usersLive.set(updatedPosts);
  }

  resetUsersLive() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('usersLive');
    }
    this.usersLive.set([]);
  }

  //--- user request
  public readonly userVideoCallRequest = signal<UserVideoCallRequest | null>(this.storageService.loadFromStorage<UserVideoCallRequest | null>('userVideoCallRequest', null));

  addUserVideoCallRequest(value: UserVideoCallRequest) {
    this.storageService.saveToStorage('userVideoCallRequest', value);
    this.userVideoCallRequest.set(value);
  }

  updateUserVideoCallRequest(updates: Partial<UserVideoCallRequest>) {
    const currentUser = this.userVideoCallRequest();
    if (!currentUser) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedUser = {
      ...currentUser,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.userVideoCallRequest.set(updatedUser);
    this.storageService.saveToStorage('userVideoCallRequest', updatedUser);
  }

  resetUserVideoCallRequest() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('userVideoCallRequest');
    }
    this.userVideoCallRequest.set(null);
  }

  //-- save users profile
  readonly usersProfile = signal<User[]>(this.storageService.loadFromStorage<User[]>('usersProfile', []));

  addUsersProfile(updatedItems: User[]) {
    this.storageService.saveToStorage('usersProfile', updatedItems);
    this.usersProfile.set(updatedItems);
  }

  updateUsersProfile(id: string, updates: Partial<User>) {
    const current = this.storageService.loadFromStorage<User[]>('usersProfile', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.usersProfile.set(updated);
    this.storageService.saveToStorage('usersProfile', updated);
  }

  removeUsersProfile(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<User[]>('usersProfile', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('usersProfile', updatedPosts);
    this.usersProfile.set(updatedPosts);
  }

  resetUsersProfile() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('usersProfile');
    }
    this.usersProfile.set([]);
  }

  //-- save users
  readonly users = signal<User[]>(this.storageService.loadFromStorage<User[]>('users', []));

  addUsers(updatedItems: User[]) {
    this.storageService.saveToStorage('users', updatedItems);
    this.users.set(updatedItems);
  }

  updateUsers(id: string, updates: Partial<User>) {
    const current = this.storageService.loadFromStorage<User[]>('users', []);
    const updated = current.map(item =>
      item._id === id ? { ...item, ...updates } : item
    );

    this.users.set(updated);
    this.storageService.saveToStorage('users', updated);
  }

  removeUsers(postId: string) {
    const currentPosts = this.storageService.loadFromStorage<User[]>('users', [])
    const updatedPosts = currentPosts.filter(post => post._id !== postId);
    this.storageService.saveToStorage('users', updatedPosts);
    this.users.set(updatedPosts);
  }

  resetUsers() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('users');
    }
    this.users.set([]);
  }

  public readonly personal = signal<User | null>(this.storageService.loadFromStorage<User | null>('personal', null));

  addPersonal(value: User) {
    this.storageService.saveToStorage('personal', value);
    this.personal.set(value);
  }

  updatePersonal(updates: Partial<User>) {
    const currentUser = this.personal();
    if (!currentUser) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedUser = {
      ...currentUser,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.personal.set(updatedUser);
    this.storageService.saveToStorage('personal', updatedUser);
  }

  resetPersonal() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('personal');
    }
    this.personal.set(null);
  }

}
