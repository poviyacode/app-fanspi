import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { Headers } from '../core/common/http-headers';

@Injectable({
    providedIn: 'root'
})
export class SoundService {

    apiUrl = `${environment.api}/sound`;

    private http = inject(HttpClient);
    private storageService = inject(StorageService);

    private activeAudio: HTMLAudioElement | null = null;

    private audioTip: HTMLAudioElement | null = null;
    private audioNotification: HTMLAudioElement | null = null;
    private audioNotificationOnline: HTMLAudioElement | null = null;
    private audioMessage: HTMLAudioElement | null = null;
    private audioStream: HTMLAudioElement | null = null;
    private audioVideocall: HTMLAudioElement | null = null;
    private audioP2pRequest: HTMLAudioElement | null = null;

    findAllUser(data: any, limit: number, offset: number): Observable<any> {
        data.Site = environment.site;
        return this.http.post<any>(this.apiUrl + `/findAllUser?limit=${limit}&offset=${offset}`, data)
            .pipe();
    }

    playCustomSound(url: string) {
        if (this.activeAudio) {
            this.activeAudio.pause();
            this.activeAudio.currentTime = 0;
        }

        this.activeAudio = new Audio(url);
        this.activeAudio.volume = 0.7; // Volumen al 70%

        this.activeAudio.play().catch((error) => {
            console.warn('El navegador bloqueó la reproducción automática del sonido personalizado:', error);
        });
    }

    stopActiveAudio() {
        if (this.activeAudio) {
            this.activeAudio.pause();
            this.activeAudio.currentTime = 0;
            this.activeAudio = null;
        }
    }

    playSoundTip() {
        if (!this.audioTip) {
            this.audioTip = new Audio('https://pub-e067974bd0fa488ba74cb435b3e86115.r2.dev/sounds/sounds_yuvinka/soun_tip_one.mp3');
        }

        try {
            this.audioTip.currentTime = 0;
            this.audioTip.play().catch((error) => {
                console.warn('El navegador bloqueó el audio automático.', error);
            });
        } catch (e) {
            console.error('Error en el sistema de reproducción de audio:', e);
        }
    }

    stopSoundTip() {
        if (this.audioTip) {
            try {
                this.audioTip.pause();
                this.audioTip.currentTime = 0;
            } catch (e) {
                console.error('Error al detener el audio:', e);
            }
        }
    }

    playSoundMessage() {
        if (!this.audioMessage) {
            this.audioMessage = new Audio('https://pub-e067974bd0fa488ba74cb435b3e86115.r2.dev/sounds/sounds_yuvinka/sound_message_one.mp3');
        }

        try {
            this.audioMessage.currentTime = 0;
            this.audioMessage.play().catch((error) => {
                console.warn('El navegador bloqueó el audio automático.', error);
            });
        } catch (e) {
            console.error('Error en el sistema de reproducción de audio:', e);
        }
    }

    stopSoundMessage() {
        if (this.audioMessage) {
            try {
                this.audioMessage.pause();
                this.audioMessage.currentTime = 0;
            } catch (e) {
                console.error('Error al detener el audio:', e);
            }
        }
    }

    playSoundNotificationOnline() {
        if (!this.audioNotificationOnline) {
            this.audioNotificationOnline = new Audio('https://pub-e067974bd0fa488ba74cb435b3e86115.r2.dev/sounds/sounds_yuvinka/sound_online_one.mp3');
        }

        try {
            this.audioNotificationOnline.currentTime = 0;
            this.audioNotificationOnline.play().catch((error) => {
                console.warn('El navegador bloqueó el audio automático.', error);
            });
        } catch (e) {
            console.error('Error en el sistema de reproducción de audio:', e);
        }
    }

    stopSoundNotificationOnline() {
        if (this.audioNotificationOnline) {
            try {
                this.audioNotificationOnline.pause();
                this.audioNotificationOnline.currentTime = 0;
            } catch (e) {
                console.error('Error al detener el audio:', e);
            }
        }
    }

    playSoundNotification() {
        if (!this.audioNotification) {
            this.audioNotification = new Audio('https://pub-e067974bd0fa488ba74cb435b3e86115.r2.dev/sounds/sounds_yuvinka/sound_notification_one.wav');
        }

        try {
            this.audioNotification.currentTime = 0;
            this.audioNotification.play().catch((error) => {
                console.warn('El navegador bloqueó el audio automático.', error);
            });
        } catch (e) {
            console.error('Error en el sistema de reproducción de audio:', e);
        }
    }

    stopSoundNotification() {
        if (this.audioNotification) {
            try {
                this.audioNotification.pause();
                this.audioNotification.currentTime = 0;
            } catch (e) {
                console.error('Error al detener el audio:', e);
            }
        }
    }

    playSoundStreaming() {
        if (!this.audioStream) {
            this.audioStream = new Audio('https://pub-e067974bd0fa488ba74cb435b3e86115.r2.dev/sounds/sounds_yuvinka/sound_live_chat_one.wav');
        }

        try {
            this.audioStream.currentTime = 0;
            this.audioStream.play().catch((error) => {
                console.warn('El navegador bloqueó el audio automático.', error);
            });
        } catch (e) {
            console.error('Error en el sistema de reproducción de audio:', e);
        }
    }

    stopSoundStreaming() {
        if (this.audioStream) {
            try {
                this.audioStream.pause();
                this.audioStream.currentTime = 0;
            } catch (e) {
                console.error('Error al detener el audio:', e);
            }
        }
    }

    playSoundVideocall() {
        if (!this.audioVideocall) {
            this.audioVideocall = new Audio('https://pub-e067974bd0fa488ba74cb435b3e86115.r2.dev/sounds/sounds_yuvinka/sound_videcall_one.mp3');
        }

        try {
            this.audioVideocall.currentTime = 0;
            this.audioVideocall.play().catch((error) => {
                console.warn('El navegador bloqueó el audio automático.', error);
            });
        } catch (e) {
            console.error('Error en el sistema de reproducción de audio:', e);
        }
    }

    stopSoundVideocall() {
        if (this.audioVideocall) {
            try {
                this.audioVideocall.pause();
                this.audioVideocall.currentTime = 0;
            } catch (e) {
                console.error('Error al detener el audio:', e);
            }
        }
    }

    playSoundP2pRequest() {
        if (!this.audioP2pRequest) {
            this.audioP2pRequest = new Audio('https://pub-e067974bd0fa488ba74cb435b3e86115.r2.dev/sounds/sounds_yuvinka/p2p_request.mp3');
        }

        try {
            this.audioP2pRequest.currentTime = 0;
            this.audioP2pRequest.play().catch((error) => {
                console.warn('El navegador bloqueó el audio automático.', error);
            });
        } catch (e) {
            console.error('Error en el sistema de reproducción de audio:', e);
        }
    }

    stopSoundP2pRequest() {
        if (this.audioP2pRequest) {
            try {
                this.audioP2pRequest.pause();
                this.audioP2pRequest.currentTime = 0;
            } catch (e) {
                console.error('Error al detener el audio:', e);
            }
        }
    }

}