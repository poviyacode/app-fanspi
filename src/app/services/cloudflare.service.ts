// audio.service.ts

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { lastValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Headers } from '../core/common/http-headers';

@Service()
export class CloudflareService {

  apiToken = environment.cloudflareApiToken;
  accountId = environment.cloudflareAccountId;

  private apiUrlCloudflare = `/apiCloudflare`;
  apiUrl = `${environment.api}/cloudflare`;

  private http = inject(HttpClient);

  createLiveStream(): Observable<any> {

    const apiUrl = `${this.apiUrlCloudflare}/client/v4/accounts/${environment.cloudflareAccountId}/stream/live_inputs`;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    });

    const body = {
      meta: { name: 'test stream' },
      recording: { mode: 'off' }  // Cambia 'automatic' a 'off' para desactivar la grabación automática
    };

    return this.http.post(apiUrl, body, { headers });
  }

  updateLiveStream(inputId: string, streamName: string): Observable<any> {

    const apiUrl = `${this.apiUrlCloudflare}/client/v4/accounts/${environment.cloudflareAccountId}/stream/live_inputs`;

    const url = `${apiUrl}/${inputId}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    });

    const body = {
      meta: { name: streamName },
      recording: { mode: 'off', timeoutSeconds: 10 }
    };

    return this.http.put(url, body, { headers });
  }

  deleteLiveStream(inputId: string): Observable<any> {

    const apiUrl = `${this.apiUrlCloudflare}/client/v4/accounts/${environment.cloudflareAccountId}/stream/live_inputs`;

    const url = `${apiUrl}/${inputId}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete(url, { headers });
  }


  // api
  async uploadToVideoCloudflare(file: any): Promise<any> {
    const uploadData = new FormData();
    uploadData.append("file", file);
    return await this.http.post<any[]>(environment.api + '/cloudflare' + '/upload-video', uploadData).toPromise();
  }

  async uploadToVideoCloudflareLocal(file: File): Promise<any> {
    const apiUrl = `${this.apiUrlCloudflare}/client/v4/accounts/${this.accountId}/stream`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.apiToken}`,
    });

    const formData = new FormData();
    formData.append('file', file, file.name);

    return await this.http.post(apiUrl, formData, { headers }).toPromise();
  }

  downloadVideo(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/downloadVideo', data);
  }

  downloadImage(url: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${Date.now()}.jpg`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  async uploadToImageCloudflare(file: any): Promise<any> {
    const uploadData = new FormData();
    uploadData.append("file", file);
    return await this.http.post<any[]>(environment.api + '/cloudflare' + '/upload-image', uploadData).toPromise();
  }

  // api
  async uploadToImageCloudflareApi(file: File): Promise<any> {
    const apiUrl = `${this.apiUrlCloudflare}/client/v4/accounts/${this.accountId}/images/v1`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.apiToken}`,
    });

    const formData = new FormData();
    formData.append('file', file, file.name);

    return await this.http.post(apiUrl, formData, { headers }).toPromise();
  }

  deleteStreamImage(id: any): Promise<any> {
    const apiUrl = `${this.apiUrlCloudflare}/client/v4/accounts/${environment.cloudflareAccountId}/stream/live_inputs`;
    return lastValueFrom(this.http.delete(apiUrl + '/deleteStreamImage/' + id));
  }

}
