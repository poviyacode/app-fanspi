import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Router, RouterStateSnapshot } from '@angular/router';

import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor( private authService: AuthService,
               private router: Router ){}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {

    if (this.authService.tokenExpired === false) {
      this.router.navigateByUrl('/');
      return false;
    }
    return true;
  }

  /*
  canActivate0(): Observable<boolean> | boolean {
    return this.authService.validarToken()
            .pipe(
              tap( valid => {
                if ( !valid ) {
                  this.router.navigateByUrl('/auth');
                }
              })
            );
  }
  */
  
  /*
  canLoad(): Observable<boolean> | boolean {
    return this.authService.validarToken()
      .pipe(
        tap( valid => {
          if ( !valid ) {
            this.router.navigateByUrl('/auth');
          }
        })
      );
  }*/
}
