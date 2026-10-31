import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { delay, lastValueFrom, Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Country } from '../interfaces/country';
import { ResponseApi } from '@interfaces/responseApi';

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  apiUrl = `${environment.api}/country`;

  private http = inject(HttpClient);

  findAll(): Observable<Country[]> {
    return this.http.get<Country[]>(this.apiUrl);
  }

  findAllDatting(): Promise<Country[]> {
    return lastValueFrom(this.http.get<Country[]>(this.apiUrl + '/datting'));
  }

  findAllPhone(): Observable<Country[]> {
    return this.http.get<Country[]>(this.apiUrl + '/phone');
  }

  findAllCities(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/country-cities');
  }

  search(data: any): Observable<object[]> {
    return this.http.post<Country[]>(this.apiUrl + '/search', data);
  }


}
