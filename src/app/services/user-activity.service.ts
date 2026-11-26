import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class UserActivityService {
    private userActive = new Subject<boolean>();
    userActive$ = this.userActive.asObservable();

    private idleTimeout: number = 5 * 60 * 1000; // 5 minutos de inactividad
    private timeoutId: any;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            this.setupListeners();
        }
    }

    private setupListeners(): void {
        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        activityEvents.forEach((eventName) => {
            window.addEventListener(eventName, () => this.resetTimer());
        });
    }

    private resetTimer(): void {
        clearTimeout(this.timeoutId);
        this.userActive.next(true); // El usuario está activo
        this.timeoutId = setTimeout(() => {
            this.userActive.next(false); // El usuario está inactivo
        }, this.idleTimeout);
    }
}