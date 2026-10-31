import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostMediaService {

  url = 'post-media';

  constructor(
    private http: HttpClient
  ) { }

  create(data: any, files: any): Observable<any> { 
    const uploadData = new FormData();
    //uploadData.append('files', files[0]);       // una sola imagen

    for (var i = 0; i < files.length; i++) {  

      uploadData.append("files", files[i]);       // imagenes multiples
    }  
    uploadData.append('Ad', '631a5221e163d2c8924a7992');
    return this.http.post<any[]>(environment.api + this.url + '/upload-multiple', uploadData);
  }

  deletePost(data: any): Observable<any> {
    return this.http.post<any[]>(environment.api + this.url + '/delete', data);
  }

  deleteCover(data: any): Observable<any> {
    return this.http.post<any[]>(environment.api + this.url + '/delete-cover', data);
  }

  deleteProfile(data: any): Observable<any> {
    return this.http.post<any[]>(environment.api + this.url + '/delete-profile', data);
  }

  handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Get client-side error
      errorMessage = error.error.message;
    } else {
      // Get server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    window.alert(errorMessage);
    return throwError(() => {
      return errorMessage;
    });
  }

}
