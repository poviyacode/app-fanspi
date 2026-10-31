import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Router, RouterStateSnapshot } from '@angular/router';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  
  
  constructor( 
              private authService: AuthService,
              @Inject(PLATFORM_ID) private platformId: object,
              private router: Router ){}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {

    if (isPlatformBrowser(this.platformId)) {
      //this.authService.connected !== true || this.authService.expired === true
      if (this.authService.tokenExpired === true) {
        this.router.navigateByUrl('/');
        return false;
      }
      return true;
    } else {
      return true;
    }
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
