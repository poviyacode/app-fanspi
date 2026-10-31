import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Country } from '../interfaces/country';
import { ResponseApi } from '@interfaces/responseApi';
import { Tag } from '@interfaces/tag';
import { Headers } from '../core/common/http-headers';

@Injectable({
  providedIn: 'root'
})
export class TagService {

  apiUrl = `${environment.api}/tags`;

  private http = inject(HttpClient);

  create(data: any): Observable<Tag> {
    return this.http.post<Tag>(this.apiUrl +  '/', data, Headers.HttpOptions());
  }

  delete(id: any): Observable<Tag> {
    return this.http.delete<Tag>(this.apiUrl +  '/' + id, Headers.HttpOptions());
  }

  findAll(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.apiUrl, Headers.HttpOptions());
  }

  findAllPhone(): Observable<Country[]> {
    return this.http.get<Country[]>(this.apiUrl +  '/phone' ) ;
  }

  findAllCities(): Observable<any> {
    return this.http.get<any>(this.apiUrl +  '/country-cities');
  }

  search(data: any): Observable<object[]> {
    return this.http.post<Country[]>(this.apiUrl +  '/search', data);
  }
}
