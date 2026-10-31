import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '@environments/environment';
import { lastValueFrom } from 'rxjs';

@Service()
export class EmailService {

  apiUrl = `${environment.api}/mail`;

  private http = inject(HttpClient);

  sendMail(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(this.apiUrl, data)
    );
  }

  sendMailBulk(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any[]>(this.apiUrl + '/bulk', data));
  }

}
