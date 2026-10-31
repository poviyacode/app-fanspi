import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class NetworkService {
    onlineStatus = signal<boolean>(navigator.onLine);

    constructor() {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            window.addEventListener('online', () => this.updateOnlineStatus(true));
            window.addEventListener('offline', () => this.updateOnlineStatus(false));
        }
    }

    private updateOnlineStatus(isOnline: boolean) {
        this.onlineStatus.set(isOnline);
    }

    isOnline(): boolean {
        return this.onlineStatus();
    }
}
