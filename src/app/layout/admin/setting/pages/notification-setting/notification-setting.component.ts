import { Component, effect, inject, Input, OnInit, PLATFORM_ID, signal, ChangeDetectionStrategy } from '@angular/core';
import { PushNotificationService } from '@services/push-notification/push-notitication.service';
import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BrowserIdService } from '@services/browser-id.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UIStyles } from '@core/common/uistyles';
import { ToolsService } from '@services/tools.service';
import { concatMap, filter, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { ToastService } from '@services/toast.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { environment } from '@environments/environment';
import { SwPush } from '@angular/service-worker';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { DialogService } from '@services/dialog.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { NotificationService } from '@services/notification.service';
import { SpinnerService } from '@services/spinner.service';
import { TelegramNotificationService } from '@services/push-notification/telegram-notification.service';
import { PushNotification } from '@interfaces/pushNotification';
import { SocketService } from '@services/socket.service';
import { WebNotificationService } from '@services/push-notification/web-notitication.service';

@Component({
  selector: 'app-notification-setting',
  imports: [
    CommonModule,
    IconDirective,
    CustomTranslatePipe,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './notification-setting.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './notification-setting.component.scss'
})
export default class NotificationSettingComponent {

  isBrowser: boolean;
  isServer: boolean;

  public isModalOpen = false;

  myform: FormGroup;

  currentRoute: string | null = null;

  pushSubscription = signal<PushSubscription | null>(null);
  webNotification = signal<PushNotification | null>(null);
  //telegramNotification = signal<PushNotification | null>(null);
  error: string | null = null;

  private resolveModal!: (response: boolean) => void;

  //sound
  audio: HTMLAudioElement | null = null;

  private destroy$ = new Subject<void>();

  public pushNotificationService = inject(PushNotificationService);
  private browserIdService = inject(BrowserIdService);
  private platformId = inject(PLATFORM_ID);
  public toolsService = inject(ToolsService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);
  private swPush = inject(SwPush);
  public router = inject(Router);
  public dialogService = inject(DialogService);
  private notificationService = inject(NotificationService);
  private spinnerService = inject(SpinnerService);
  private telegramNotificationService = inject(TelegramNotificationService);
  private webNotificationService = inject(WebNotificationService);
  private socketService = inject(SocketService);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    effect(() => {
      const { webpush } = this.pushNotificationService.userPushNotification();
      this.myform.get('isNotificationActive')?.setValue(webpush ? webpush.status === 'ACTIVE' : false);
    });

  }

  async ngOnInit() {
    this.createFormControls();
    this.findUserPushNotification();
    this.userOnlineSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {
    const { webpush } = this.pushNotificationService.userPushNotification();
    this.myform = new FormGroup({
      isNotificationActive: new FormControl(webpush ? webpush.status === 'ACTIVE' : false, Validators.nullValidator),
    });
  }

  // sockets 
  private userOnlineSocket() {

    if (!this.socketService.socket) {
      this.socketService.connect();
    }

    this.socketService.onUserSync().pipe(
      filter(event => event.entity === 'pushNotification'), // Solo filtramos los de esta entidad
      takeUntil(this.destroy$)
    ).subscribe(event => {
      const { action, payload } = event;
      if (action === 'subscribeTelegram') {
        this.pushNotificationService.updateUserPushNotification({ telegram: payload });
      } else if (action === 'unsubscribeTelegram') {
        this.pushNotificationService.updateUserPushNotification({ telegram: payload });
      }
    });
  }

  async findUserPushNotification() {

    this.spinnerService.start();

    const deviceInfo = await this.browserIdService.getFullDeviceInfo()!;
    const data = {
      browserId: deviceInfo.browserId
    }

    this.pushNotificationService.findByUser(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {

          this.pushNotificationService.addUserPushNotification(res);
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'notificationEnabled' });
        }
      });
  }

  async create() {

    const deviceInfo = await this.browserIdService.getFullDeviceInfo()!;

    if (!this.pushSubscription() || !deviceInfo) {
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
      return;
    }

    const pushSubscription = this.pushSubscription();

    const data = {
      token: pushSubscription,
      ...deviceInfo
    };

    this.spinnerService.start();

    const payload: any = {
      token: {
        endpoint: "https://fcm.googleapis.com/fcm/send/flVY7Afph0s:APA91bHm6-aI5BLJO40VMSjQZssIQ6ZeMYZdR5DhL9wiAe2YLJERJsDzQXnBPk4w8InhK3fsH_cjS-Naza2bWiiRuu8-s1e8bMydQ2Vj3X5Xo_AA6ok-HvRJfupukn0yWGoblZIgBqhs",
        expirationTime: null,
        keys: {
          p256dh: "BMeUSeXxMBFMsCB7AIbZmrj7gFTgy0te7YWj1LlGSiAsi3Dj7FlxzBAju3lSzBxHAY7A8dnzBOvNkSX92bZDZVE",
          auth: "liPHVSSFcHziSkdRcJIBpQ"
        }
      },
      browserId: "658d16a7d031ae2f37c00f01decbf135",
      ipAddress: "2804:391c:c000:3000:ab1c:4ef2:11f:ffd4",
      browser: "Chrome",
      os: "Windows",
      deviceType: "desktop"
    };
    this.webNotificationService.create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && res.User === this.authService.user()?._id) {
            //this.eventNotification();
            this.pushNotificationService.updateUserPushNotification({ webpush: res });
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'notificationEnabled' });
        }
      });
  }

  onSubmit() {
    if (this.myform.valid) {
      const { webpush } = this.pushNotificationService.userPushNotification();

      if (webpush?.status !== 'ACTIVE') {
        this.enableNotifyConfirm('refreshToken');
      } else {
        this.onUnsubscribe();
      }
    }
  }
  // Habilitar notificaciones
  async enableNotifyConfirm(value: string) {

    // if (!this.swPush.isEnabled && environment.production) {
    //   throw new Error('El service worker no está disponible.');
    // }

    try {
      if (Notification.permission !== 'granted' && environment.production) {
        // Si no hay permiso, solicitar suscripción
        const pushSubscription = await this.requestSubscription();
        //Extraer el token completo
        const token = this.extractTokenFromSubscription(pushSubscription);
        this.pushSubscription.set(token);
      } else {

        const isConfirm = await this.showConfirmationRefreshTokenModal();
        if (isConfirm) {
          const pushSubscription = await this.requestSubscription();
          const token = this.extractTokenFromSubscription(pushSubscription);
          this.pushSubscription.set(token);
        } else {
          // Retornar la suscripción existente
          const pushSubscription = await this.getSubscription();
          const token = this.extractTokenFromSubscription(pushSubscription!);
          this.pushSubscription.set(token);
        }
      }

      if (this.pushSubscription()) {
        this.create();
      }

    } catch (error: any) {
      this.toastService.start({ type: 'error', message: 'enableNotifications' });
    }
  }

  private extractTokenFromSubscription(pushSubscription: PushSubscription): any {
    const jsonSubscription = pushSubscription.toJSON();
    return jsonSubscription;
  }

  // modal
  private showConfirmationRefreshTokenModal(): Promise<boolean> {
    this.isModalOpen = true;
    this.dialogService.toggleModal('confirmNotificationRefreshToken');

    return new Promise((resolve) => {
      this.resolveModal = resolve; // Guardamos la función resolve para usarla más tarde
    });
  }

  // Manejar la respuesta del modal
  handleModalResponseOne = (response: boolean): void => {
    if (!this.resolveModal) {
      return;
    }

    this.dialogService.closeModal();
    this.resolveModal(response); // Resolvemos la promesa con la respuesta del usuario
  };

  onCloseModal() {
    // let url = 'https://tiktok.com';
    // window.open(`${url}`, "_parent", "noopener,noreferrer");
    this.dialogService.closeModal();
  }

  // Solicitar una nueva suscripción
  private async requestSubscription(): Promise<PushSubscription> {
    if (!environment.publicKey) {
      throw new Error('La clave pública (publicKey) no está configurada en el archivo environment.');
    }

    if (!this.swPush.isEnabled) {
      throw new Error('El service worker no está disponible.');
    }

    try {
      const pushSubscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.publicKey,
      });

      return pushSubscription;
    } catch (error: any) {
      throw new Error('No se pudo generar la suscripción.');
    }
  }

  // Obtener la suscripción actual
  private async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swPush.isEnabled) {
      throw new Error('El service worker no está disponible.');
    }

    try {
      const pushSubscription = await firstValueFrom(this.swPush.subscription);
      if (pushSubscription) {
        return pushSubscription;
      } else {
        throw new Error('No hay una suscripción activa.');
      }
    } catch (error: any) {
      throw new Error('No se pudo obtener la suscripción.');
    }
  }

  // Cancelar la suscripción
  async onUnsubscribe() {

    this.spinnerService.start();
    if (!this.authService.user()) {
      return;
    }

    if (this.swPush.isEnabled && Notification.permission === 'granted') {
      this.swPush.unsubscribe();
    }

    const deviceInfo = await this.browserIdService.getFullDeviceInfo()!;

    if (!deviceInfo) {
      this.spinnerService.close();
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
      return;
    }


    this.webNotificationService.deleteToken(deviceInfo.browserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && Number(res.deletedCount) === 1) {

            this.pushNotificationService.updateUserPushNotification({ webpush: { status: 'INACTIVE' } });

            this.myform.get('isNotificationActive')?.setValue(false);
          } else {
            this.myform.get('isNotificationActive')?.setValue(true);
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        }
      });
  }

  // Limpiar suscripciones
  private cleanupSubscriptions(subscriptions: { unsubscribe: () => void }[]): void {
    subscriptions.forEach((pushSubscription) => pushSubscription.unsubscribe());
  }

  // default  -----------------------------
  async enableNotifyDefault() {
    try {

      if (!this.authService.user()) {
        return;
      }

      const pushSubscription = await this.pushNotificationService.enableNotify();
      this.pushSubscription.set(pushSubscription);
      this.error = null; // Limpiar errores anteriores

      if (!this.pushSubscription) {
        return;
      }

      this.create();

    } catch (err: any) {
      this.toastService.start({ type: 'error', message: 'enableNotifications' });
    }
  }

  // Obtener la suscripción
  async getSubscriptionDefaul() {
    try {
      const pushSubscription = await this.pushNotificationService.getSubscription();
      this.pushSubscription.set(pushSubscription);
      this.error = null; // Limpiar errores anteriores

    } catch (err: any) {
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
    }
  }

  // Desuscribirse
  async unsubscribeDefaul() {

    if (!this.authService.user()) {
      return;
    }

    this.pushNotificationService.unsubscribe();
    this.pushSubscription.set(null); // Limpiar la suscripción
    this.error = null; // Limpiar errores

    const deviceInfo = await this.browserIdService.getFullDeviceInfo()!;

    if (!deviceInfo) {
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
      return;
    }

    this.webNotificationService.deleteToken(deviceInfo.browserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && Number(res.deletedCount) === 1) {
            this.pushNotificationService.resetPushNotification();
          }
        },
        error: (err) => {
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        }
      });
  }

  eventNotificationDefault() {
    const data = this.pushNotificationService.eventPushNotification()!;
    if (!data) {
      return;
    }

    const { event, message } = data;
    if (event === 'MESSAGES') {

    }
  }

  // notification
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {

        this.swPush.requestSubscription({
          serverPublicKey: environment.publicKey,
        }).then(pushSubscription => {

          this.pushSubscription.set(pushSubscription);

          if (!this.pushSubscription) {
            return;
          }

          this.create();

        }).catch(err => {
          console.error('No se pudo obtener la suscripción', err);
        });

      }

    } catch (error) {
      console.error('Ocurrió un error al solicitar el permiso:', error);
    }
  }

  // telegram notification
  onSubscribeTelegram() {

    this.telegramNotificationService.generateTempToken()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const { url } = res;
          if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        },
        error: (err) => {
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        }
      });
  }

  onUnsubscribeTelegram() {

    this.pushNotificationService.unsubscribeTelegram()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {

        },
        error: (err) => {
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        }
      });
  }

  showNotification() {
    const title = '¡Hola!';
    const options = {
      body: 'Esta es una notificación desde Angular.',
      icon: 'assets/icons/icon.webp',
    };
    this.pushNotificationService.showNotification(title, options);
  }

  // input class
  inputClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  selectClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return UIStyles.textareaClass(formGroup, controlName, height);
  }

  buttonClass() {
    return UIStyles.buttonClass();
  }

  cardClass() {
    return UIStyles.cardClass();
  }

  modalClass() {
    return UIStyles.modalClass();
  }

  buttonClassForm(value: boolean) {
    return UIStyles.buttonClassForm(value);
  }

  buttonSecondaryClass() {
    return UIStyles.buttonSecondaryClass();
  }

  cardModalClass() {
    return UIStyles.cardModalClass();
  }

}
