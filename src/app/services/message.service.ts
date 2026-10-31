import { HttpClient } from '@angular/common/http';
import { Injectable, signal, inject, computed, Signal } from '@angular/core';
//import { Socket } from 'ngx-socket-io';
import { Observable, catchError, delay, lastValueFrom, map, retry, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { Router } from '@angular/router';
import { Message } from '@interfaces/message';
import { User } from '@interfaces/user';
import { StorageService } from './storage.service';

export interface resFindByChat {
  currentDate: Date,
  Messages: Message[]
};

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  apiUrl = `${environment.api}/message`;

  private http = inject(HttpClient);
  private router = inject(Router);
  private storageService = inject(StorageService);

  private messagesSignal = signal<Message[]>([]);
  // private db = new Dexie('fanspiDB') as Dexie & {
  //   messages: Dexie.Table<Message, number>;
  // };

  constructor() {
    // Configura el esquema de la base de datos
    // this.db.version(1).stores({
    //   messages: '++id, &_id, code, Chat._id, message, createdAt'
    // });

    // Carga los mensajes existentes al inicializar el servicio
    this.loadMessagesFromDB();
  }

  findByMessage(id: string): Observable<Message[]> {
    return this.http.get<Message[]>(this.apiUrl + '/findByMessage/' + id, Headers.HttpOptions()).pipe(delay(200));
  }

  findOne(id: string): Observable<Message> {
    return this.http.get<Message>(this.apiUrl + '/' + id, Headers.HttpOptions()).pipe(delay(200));
  }

  findByChat(id: string): Observable<resFindByChat> {
    return this.http.get<resFindByChat>(this.apiUrl + '/findByChat/' + id, Headers.HttpOptions()).pipe(delay(200));
  }

  sendMessageEmail(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(this.apiUrl + '/sendMessageEmail/', data, Headers.HttpOptions()).pipe(delay(200)));
  }

  delete(id: any): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/' + id);
  }

  // SIGNAL

  // save messages
  readonly messages = signal<Message[]>(this.storageService.loadFromStorage<Message[]>('messages', []));

  addMessages(updatedMessages: Message[]) {
    this.storageService.saveToStorage('messages', updatedMessages);
    this.messages.set(updatedMessages);
  }

  updateMessages(id: string, updates: Partial<Message>) {
    const current = this.storageService.loadFromStorage<Message[]>('messages', []);
    const updated = current.map(item =>
      (item._id === id || item.id === id || item.code === id) ? { ...item, ...updates } : item
    );

    this.messages.set(updated);
    this.storageService.saveToStorage('messages', updated);
  }

  removeMessages(messageId: any) {
    const currentMessages = this.storageService.loadFromStorage<Message[]>('messages', [])
    const updatedMessages = currentMessages.filter(message => message._id !== messageId);
    this.storageService.saveToStorage('messages', updatedMessages);
    this.messages.set(updatedMessages);
  }

  resetMessages() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('messages');
    }
    this.messages.set([]);
  }

  // save chat
  public readonly message = signal<Message | null>(this.storageService.loadFromStorage<Message | null>('message', null));

  addMessage(value: Message) {
    this.storageService.saveToStorage('message', value);
    this.message.set(value);
  }

  updateMessage(updates: Partial<Message>) {
    const currentMessage = this.message();
    if (!currentMessage) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedMessage = {
      ...currentMessage,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.message.set(updatedMessage);
    this.storageService.saveToStorage('message', updatedMessage);
  }

  resetMessage() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('message');
    }
    this.message.set(null);
  }

  //--- signals
  public readonly userReceiver = signal<User | null>(this.storageService.loadFromStorage<User | null>('userReceiver', null));

  addUserReceiver(value: User) {
    this.storageService.saveToStorage('userReceiver', value);
    this.userReceiver.set(value);
  }

  updateUserReceiver(updates: Partial<User>) {
    const currentUser = this.userReceiver();
    if (!currentUser) return; // Si no hay usuario, salir

    // Combinar los cambios con el usuario actual
    const updatedUser = {
      ...currentUser,
      ...updates
    };

    // Actualizar la signal y el almacenamiento
    this.userReceiver.set(updatedUser);
    this.storageService.saveToStorage('userReceiver', updatedUser);
  }

  resetUserReceiver() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('userReceiver');
    }
    this.userReceiver.set(null);
  }

  // dexie
  // Carga inicial de mensajes desde IndexedDB
  private async loadMessagesFromDB() {
    // const messages = await this.db.messages.toArray();
    // this.messagesSignal.set(messages);
  }

  // Añade un mensaje (actualiza Signal y Dexie)
  async addMessageDixe(message: Message) {
    // const id = await this.db.messages.put(message);
    // message.id = id; // Asigna el ID generado por Dexie
    // this.messagesSignal.update(messages => [...messages, message]);
  }

  // Elimina un mensaje (actualiza Signal y Dexie)
  async deleteMessage(messageId: number) {
    // await this.db.messages.delete(messageId);
    // this.messagesSignal.update(messages =>
    //   messages.filter(m => m.id !== messageId)
    // );
  }

  // Obtiene mensajes por chat (filtro reactivo)
  messagesByChat(chatId: string): Signal<Message[]> {
    return computed(() =>
      this.messagesSignal().filter(m => m.Chat._id === chatId)
    );
  }

  // Limpia todos los mensajes (Signal y Dexie)
  async clearMessages() {
    // await this.db.messages.clear();
    // this.messagesSignal.set([]);
  }
}
