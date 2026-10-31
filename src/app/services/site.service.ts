import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom, Observable, throwError } from 'rxjs';
import { retry, catchError, delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { StateCity } from '../interfaces/stateCity';
import { ResSiteRedirect, Site } from '@interfaces/site';

@Injectable({
  providedIn: 'root'
})
export class SiteService {

  apiUrl = `${environment.api}/site`;

  private http = inject(HttpClient);

  findSiteRedirect(dataQuery: any): Promise<ResSiteRedirect> {
    return lastValueFrom(this.http.post<ResSiteRedirect>(this.apiUrl + '/findSiteRedirect/', dataQuery)
      .pipe(delay(200)));
  }

  findSite(dataQuery: any): Promise<Site> {
    return lastValueFrom(this.http.post<Site>(this.apiUrl + '/findSite/', dataQuery)
      .pipe(delay(200)));
  }
}
