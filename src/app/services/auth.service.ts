import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, delay, map, Observable, of, tap } from 'rxjs';
import { Headers } from '../core/common/http-headers';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SocketService } from './socket.service';
import { AuthResponse, User, UserVisit } from '@interfaces/user';
import { ResponseApi } from '@interfaces/responseApi';
import { VersionService } from './version.service';
import { UserService } from './user.service';
import { StorageService } from './storage.service';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  apiUrl = `${environment.api}/auth`;

  http = inject(HttpClient);
  socketService = inject(SocketService);
  versionService = inject(VersionService);
  userService = inject(UserService);
  chatService = inject(ChatService);
  storageService = inject(StorageService);

  // register
  register(data: any): Observable<any> {
    data.Site = environment.site;

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(resp => {
          if (resp.ok === true) {
            this.storageService.saveToStorage('access_token', resp.data?.access_token!);
            this.addToken(resp.data?.access_token!);
            this.storageService.saveToStorage('user', resp.data?.user!);
            this.addUser(resp.data?.user!);
            this.socketConnect();
          }
        }),
        map(resp => resp),
        catchError(err => of(err.error.msg))
      );
  }

  // login
  login(data: any) {
    data.Site = environment.site;

    return this.http.post<ResponseApi>(`${this.apiUrl}/login`, data)
      .pipe(
        tap(resp => {
          if (resp.ok === true && resp.data.user.status !== 'DELETE') {
            this.storageService.saveToStorage('access_token', resp.data?.access_token!);
            this.addToken(resp.data?.access_token!);
            this.addUser(resp.data?.user!);
            this.socketConnect();
          }

        }),
        map(resp => resp),
        catchError(err => of(err.error.msg))
      );
  }

  verifyToken(data: any): Observable<any> {
    data.Site = environment.site;
    return this.http.post<ResponseApi>(`${this.apiUrl}/verify-token`, data)
      .pipe(
        tap(resp => {
          if (resp.ok == true) {
            this.storageService.saveToStorage('access_token', data?.token!);
            this.addToken(resp.data?.access_token!);
            this.addUser(resp.data?.user!);
            this.socketConnect();
          }

        }),
        map(resp => resp),
        catchError(err => of(err.error.msg))
      );
  }

  confirmEmail(data: any): Observable<any> {
    data.Site = environment.site;

    return this.http.post<AuthResponse>(`${this.apiUrl}/confirmEmail`, data)
      .pipe(
        tap(resp => {
          if (resp.ok === true) {
            this.storageService.saveToStorage('access_token', resp.data?.access_token!);
            this.addToken(resp.data?.access_token!);
            this.storageService.saveToStorage('user', resp.data?.user!);
            this.addUser(resp.data?.user!);
            this.socketConnect();
          }
        }),
        map(resp => resp),
        catchError(err => of(err.error.msg))
      );
  }

  requestPasswordReset(data: any,): Observable<any> {
    data.Site = environment.site;
    return this.http.post<any>(this.apiUrl + `/requestPasswordReset`, data)
      .pipe(delay(200));
  }

  resetPassword(data: any,): Observable<any> {
    return this.http.post<any>(this.apiUrl + `/resetPassword`, data)
      .pipe(delay(200));
  }

  socketConnect() {
    this.socketService.socketConnect(this.token());
  }
  // verified account
  verifiedAccount(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/verifiedAccount', data, Headers.HttpOptions());
  }

  // send code email
  sendCodeEmail(): Observable<User> {
    const data = {};
    return this.http.post<User>(this.apiUrl + '/send-code-email', data, Headers.HttpOptions());
  }

  get getToken(): any {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('access_token');
    } else {
      return null;
    }
  }

  // VERIFICAR SI ESTA CONECTADO CON TOKEN
  get connected(): boolean {
    return (localStorage.getItem('access_token') !== null);
  }

  // VERIFICAR SI ESTA CADUCADO EL TOKEN
  get expired(): boolean {

    /*const helper = new JwtHelperService();
    console.log(helper.isTokenExpired(this.getToken));
    return helper.isTokenExpired(this.getToken);*/
    return true;
  }

  logout() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      //this.versionService.checkForUpdates();
      this.socketService.disconnect();

      this.removeUser();
      this.userService.resetUserProfile();
      this.chatService.resetChats();
    }
  }

  get tokenExpired() {
    //console.log(this.getToken)
    if (this.getToken) {
      /*const expiry = (JSON.parse(atob(this.getToken.split('.')[1]))).exp;
      const res= (Math.floor((new Date).getTime() / 1000)) >= expiry;
      //console.log(new Date(Math.floor((new Date).getTime() / 1000)))
      //console.log(new Date(expiry));
      console.log(res);
      return res;*/
      return false;
    } else {
      return true;
    }
  }

  /*
  validarToken(): Observable<boolean> {

    const url = `${ this.baseUrl }/auth/renew`;
    const headers = new HttpHeaders()
      .set('x-token', localStorage.getItem('token') || '' );

    return this.http.get<AuthResponse>( url, { headers } )
        .pipe(
          map( resp => {
            localStorage.setItem('token', resp.access_token! );
            this._user = {
              name: resp.name!,
              uid: resp.uid!,
              email: resp.email!
            }

            return resp.ok;
          }),
          catchError( err => of(false) )
        );

  }
  */

  // private
  // public private = signal<boolean>(this.storageService.loadFromStorage<boolean>('private', false));

  // addPrivate(value: any) {
  //   this.storageService.saveToStorage('private', value);
  //   this.private.set(value);
  // }
  // site 
  public readonly userVisit = signal<UserVisit | null>(this.storageService.loadFromStorage<UserVisit | null>('userVisit', null));

  addUserVisit(value: UserVisit) {
    this.storageService.saveToStorage('userVisit', value);
    this.userVisit.set(value);
  }

  updateUserVisit(updates: Partial<UserVisit>) {
    const currentUser = this.userVisit();
    if (!currentUser) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedUser = {
      ...currentUser,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.userVisit.set(updatedUser);
    this.storageService.saveToStorage('userVisit', updatedUser);
  }

  resetUserVisit() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('userVisit');
    }
    this.userVisit.set(null);
  }

  // token
  public token = signal<null>(this.storageService.loadFromStorage<null>('access_token', null));

  addToken(value: any) {
    this.storageService.saveToStorage('access_token', value);
    this.token.set(value);
  }

  // user auth
  public user = signal<User | null>(this.storageService.loadFromStorage<User | null>('user', null));

  addUser(value: any) {
    this.storageService.saveToStorage('user', value);
    this.user.set(value);
  }

  updateUser(updates: Partial<User>) {
    const currentUser = this.user();
    if (!currentUser) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedUser = {
      ...currentUser,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.user.set(updatedUser);
    this.storageService.saveToStorage('user', updatedUser);
  }

  removeUser() {
    this.storageService.saveToStorage('user', null);
    this.user.set(null);
  }

}
