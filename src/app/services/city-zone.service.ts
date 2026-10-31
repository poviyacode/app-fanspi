import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { CityZone } from '../interfaces/cityZone';

@Injectable({
  providedIn: 'root'
})
export class CityZoneService {

  url = 'city-zone';
  
  constructor(
    private http: HttpClient
  ) 
  { 
    
  }

  findAllStateCity(data:any): Observable<object[]> {
   
    return this.http.post<CityZone[]>(environment.api + this.url + '/city', data);
  }
}