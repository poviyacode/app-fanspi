import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Obtiene el token directamente desde el signal del AuthService
    const token = authService.token();
    let clonedReq = req;

    if (token) {
        clonedReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(clonedReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Si el backend detecta baneo o cuenta eliminada en cualquier petición
            if (error.status === 403) {
                const errorCode = error.error?.code;

                if (errorCode === 'ACCOUNT_SUSPENDED') {
                    authService.logout();
                    router.navigate(['/auth/suspended']);
                } else if (errorCode === 'ACCOUNT_DELETED') {
                    authService.logout();
                    router.navigate(['/auth/deleted']);
                }
            }

            return throwError(() => error);
        })
    );
};