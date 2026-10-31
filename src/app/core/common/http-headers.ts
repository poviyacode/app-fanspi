import { HttpHeaders } from '@angular/common/http';

export class Headers {
  static HttpOptions() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = JSON.parse(localStorage.getItem('access_token')!);
      if (token) {
        return {
          headers: new HttpHeaders({
            'Authorization': `Bearer ${token}`
          })
        };
      }
    }
    return {}; // Retorna un objeto vacío si no se puede acceder al localStorage o si no hay token
  }
}
