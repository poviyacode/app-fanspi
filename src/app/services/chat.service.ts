import { HttpClient } from '@angular/common/http';
import { Injectable, signal, inject, Injector } from '@angular/core';
import { Observable, combineLatest, delay, forkJoin, from, lastValueFrom, map, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { Chat } from '@interfaces/chat';
import { StorageService } from './storage.service';
import { User, UserCurrent } from '@interfaces/user';
import { UserService } from './user.service';
import { MessageService } from './message.service';
import { SpinnerService } from './spinner.service';
import { ToastService } from './toast.service';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  apiUrl = `${environment.api}/chat`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private spinnerService = inject(SpinnerService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private injector = inject(Injector);

  private get authService() {
    return this.injector.get(AuthService);
  }

  // create
  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, Headers.HttpOptions());
  }

  update(id: string, data: any): Observable<Chat> {
    const uri = this.apiUrl + '/' + id;
    return this.http.put<Chat>(uri, data, Headers.HttpOptions());
  }

  // find by ud user
  findByIdUser(data: any, limit: number, offset: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `/findByIdUser?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  getConversations(data: any, limit: number, offset: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `/getConversations?limit=${limit}&offset=${offset}`, data, Headers.HttpOptions())
      .pipe(delay(200));
  }

  // find one chat
  findOne(id: any): Observable<any> {
    return this.http
      .get<any>(this.apiUrl + '/' + id, Headers.HttpOptions());
  }

  // Chat By Id
  chatById(id: any): Promise<any> {
    return lastValueFrom(this.http.get<any>(this.apiUrl + '/chatById/' + id, Headers.HttpOptions())
      .pipe(delay(200)));
  }

  // Chat By Receiver
  chatByReceiver(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(this.apiUrl + '/chatByReceiver', data, Headers.HttpOptions())
      .pipe(delay(200)));
  }

  // find one messages
  findOneMessages(id: any): Observable<any> {
    return this.http
      .get<any>(this.apiUrl + '/find-one-messages/' + id, Headers.HttpOptions());
  }

  // chat media
  findAllChatMedia(data: any, limit: number, offset: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `/findAllChatMedia?limit=${limit}&offset=${offset}`, data)
      .pipe(delay(200));
  }

  // save chats
  readonly chats = signal<Chat[]>(this.storageService.loadFromStorage<Chat[]>('chats', []));

  addChats(updatedChats: Chat[]) {
    this.storageService.saveToStorage('chats', updatedChats);
    this.chats.set(updatedChats);
  }

  updateChats(id: string, updates: Partial<Chat>) {
    const current = this.storageService.loadFromStorage<Chat[]>('chats', []);
    const updated = current.map(item =>
      (item._id === id || item.id === id) ? { ...item, ...updates } : item
    );

    this.chats.set(updated);
    this.storageService.saveToStorage('chats', updated);
  }

  removeChats(chatId: string) {
    const currentChats = this.storageService.loadFromStorage<Chat[]>('chats', [])
    const updatedChats = currentChats.filter(chat => chat._id !== chatId && chat.id !== chatId)
    this.storageService.saveToStorage('chats', updatedChats);
    this.chats.set(updatedChats);
  }

  resetChats() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('chats');
    }
    this.chats.set([]);
  }

  // save chat
  public readonly chat = signal<Chat | null>(this.storageService.loadFromStorage<Chat | null>('chat', null));

  addChat(value: Chat) {
    this.storageService.saveToStorage('chat', value);
    this.chat.set(value);
  }

  updateChat(updates: Partial<Chat>) {
    const currentUser = this.chat();
    if (!currentUser) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updated = {
      ...currentUser,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.chat.set(updated);
    this.storageService.saveToStorage('chat', updated);
  }

  // functions
  async startChatWithProfile(data: { Sender: User, Receiver: User }) {

    const { Sender, Receiver } = data;
    const currentUser = Sender;
    const targetProfile = Receiver;

    // 1. Validar autenticación
    if (!currentUser?._id) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // 2. Validar estado de cuenta
    if (currentUser.status === 'SUSPENDED') {
      this.toastService.start({ type: 'error', message: 'accountSuspended' });
      return;
    }

    // 3. Evitar chat con uno mismo
    if (currentUser._id === targetProfile?._id) return;

    this.spinnerService.start();

    const dataSend = { Receiver: targetProfile! };

    this.create(dataSend).subscribe({
      next: (res) => {
        if (res) {
          this.messageService.addUserReceiver(targetProfile!);
          this.addChat(res);
          this.router.navigate(['/chats/messages', res._id]);
        }
      },
      error: () => {
        this.spinnerService.close();
        this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
      },
      complete: () => this.spinnerService.close()
    });
  }

}
