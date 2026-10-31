import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class BaseHttpService {
  http = inject(HttpClient);
  apiUrl = environment.api;
  apiSocket = environment.apiSocket;
  socketService = SocketService
}
