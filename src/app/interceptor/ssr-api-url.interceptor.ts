import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const ssrApiUrlInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);

    // Resolver URL absoluta solo cuando se ejecuta en el servidor SSR
    if (isPlatformServer(platformId) && req.url.startsWith('/api')) {
        const serverReq = req.clone({
            url: `https://api.fanspi.com${req.url}`,
        });
        return next(serverReq);
    }

    return next(req);
};