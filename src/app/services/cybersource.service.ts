import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CybersourceService {

  apiUrl = `${environment.api}/cybersource`;
  private http = inject(HttpClient);

  generate(data: any): Observable<object> {
    return this.http.post<any>(this.apiUrl + '/signeddatafields', data);
  }
}
