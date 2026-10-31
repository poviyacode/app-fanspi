import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root',
})

export class VersionService {
    private apiUrl = `${environment.api}`;
    private version = '2.1.0';
    private http = inject(HttpClient);
  
    checkForUpdates() {
      this.http.get<{ yuvinka: string }>(`${this.apiUrl}/app-versions`).subscribe({
        next: (res) => {
          const serverVersion = res.yuvinka;
          const lastCheckedVersion = localStorage.getItem('lastCheckedVersion');
          console.log(`${serverVersion}`);

          if (serverVersion && serverVersion !== this.version && serverVersion !== lastCheckedVersion) {
            this.clearAppData();
            localStorage.setItem('lastCheckedVersion', serverVersion);
          }
          
        },
        error: (error) => console.error('Error versión:', error),
      });
    }
  
    private clearAppData() {
      localStorage.clear();
      sessionStorage.clear();
      //location.reload();
      //window.location.href = '/';
    }
  }
  