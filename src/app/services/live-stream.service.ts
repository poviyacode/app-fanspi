import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { LiveStream } from '@interfaces/liveStream';
import { SocketService } from './socket.service';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';

@Service()
export class LiveStreamService {

  apiUrl = `${environment.api}/live-stream`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);

  handleLiveStreamStatus(data: any): Observable<LiveStream | null> {
    return this.http.post<LiveStream>(this.apiUrl + '/handleLiveStreamStatus', data, Headers.HttpOptions())
      .pipe(
        tap((liveStream) => {
          if (!liveStream) return;

          if (!this.socketService.socket) {
            this.socketService.connect();
          }

          const isLiveActive = data?.User?.live ?? data?.live;
          const roomId = liveStream.liveRoomId;

          if (roomId && isLiveActive) {
            this.addLiveStream(liveStream);

            this.socketService.joinRoom(roomId, (res) => {
              if (res && res.status === 'joined') {
                console.log('Socket joined room:', res.room);
              }
            });

          } else if (roomId && !isLiveActive) {
            this.resetLiveStream();
            this.socketService.leaveRoom(roomId, (res) => {
              if (res && res.status === 'left') {
                console.log('Socket left room:', res.room);
              }
            });
          }
        }),
        catchError((err) => {
          return of(null);
        })
      );
  }

  handleLiveStreamStatus0(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/handleLiveStreamStatus', data, Headers.HttpOptions())
      .pipe(
        tap((liveStream) => {
          //this.addLiveStream(liveStream);
          console.log('🚀 liveStream', liveStream.liveRoomId && data.User.live);
          // if (liveStream && liveStream.liveRoomId && data.User.live) {
          //   console.log('🚀 Live Stream Status:', liveStream.liveRoomId);
          //   this.addLiveStream(liveStream);
          //   this.socketService.joinRoom(liveStream.liveRoomId, (res) => {
          //     if (res && res.status === 'joined') {
          //       console.log('Socket joined room:', res.room);
          //     }
          //   });
          // } else if (liveStream && liveStream.liveRoomId && !data.live) {
          //   this.resetLiveStream();
          //   this.socketService.leaveRoom(liveStream.liveRoomId, (res) => {
          //     if (res && res.status === 'left') {
          //       console.log('Socket left room:', res.room);
          //     }
          //   });
          // }
        })
      );
  }

  getStreamBy(data: any): Observable<LiveStream> {
    return this.http.post<LiveStream>(this.apiUrl + '/getStreamBy', data, Headers.HttpOptions());
  }

  acceptCall(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/acceptCall', data, Headers.HttpOptions());
  }

  rejectCall(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/rejectCall', data, Headers.HttpOptions())
      .pipe(
        tap((liveStream) => {
          if (liveStream && liveStream.liveRoomId) {
            this.resetLiveStream();
            this.socketService.leaveRoom(liveStream.liveRoomId, (res) => {
              if (res && res.status === 'left') {
                console.log('Socket left room:', res.room);
              }
            });
          }
        })
      );
  }

  //--- live match 
  findRandomLiveMatch(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/findRandomLiveMatch', data, Headers.HttpOptions());
  }

  nextRandomMatch(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/nextRandomMatch', data, Headers.HttpOptions());
  }

  leaveMatch(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/leaveMatch', data, Headers.HttpOptions());
  }

  //--- signals
  public readonly liveStream = signal<LiveStream | null>(
    this.storageService.loadFromStorage<LiveStream | null>('liveStream', null)
  );

  addLiveStream(value: LiveStream) {
    this.storageService.saveToStorage('liveStream', value);
    this.liveStream.set(value);
  }

  updateLiveStream(updates: Partial<LiveStream>) {
    const currentLiveStream = this.liveStream();
    if (!currentLiveStream) return;

    const updatedLiveStream = {
      ...currentLiveStream,
      ...updates
    };

    this.liveStream.set(updatedLiveStream);
    this.storageService.saveToStorage('liveStream', updatedLiveStream);
  }

  resetLiveStream() {
    this.storageService.removeFromStorage('liveStream');
    this.liveStream.set(null);
  }

}
