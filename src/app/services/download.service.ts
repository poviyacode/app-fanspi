import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';
import { StorageService } from './storage.service';

@Service()
export class DownloadService {

  apiUrl = `${environment.api}/download`;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  create(data: any): Observable<boolean> {
    return this.http.post<boolean>(this.apiUrl + '/', data, Headers.HttpOptions());
  }

}
