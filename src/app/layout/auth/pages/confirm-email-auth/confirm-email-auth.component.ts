import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Tools } from '@core/common/tools';
import { IconDirective } from '@directive/coin-svg.directive';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { SpinnerService } from '@services/spinner.service';
import { ToolsService } from '@services/tools.service';
import { Subject, takeUntil } from 'rxjs';

export interface Encode {
  token?: string;
  email?: string;
};

@Component({
  selector: 'app-confirm-email-auth',
  imports: [CommonModule, IconDirective, CustomTranslatePipe],
  templateUrl: './confirm-email-auth.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './confirm-email-auth.component.scss'
})
export default class ConfirmEmailAuthComponent {

  isBrowser: boolean;
  isServer: boolean;

  loading = signal(false);
  token: string;
  email = signal('');
  emailVerified = signal(false);

  private destroy$ = new Subject<void>();

  private title = inject(Title);
  public authService = inject(AuthService);
  private activatedRoute = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  public toolsService = inject(ToolsService);

  constructor() {
    this.title.setTitle('Confirm email');
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.activatedRoute.queryParams.subscribe(params => {

        const encodedData = params['data'];
        if (encodedData) {
          try {
            const secretKey = 'your-secret-key';

            // Decodificar Base64
            const encryptedData = atob(encodedData);

            // Desencriptar usando XOR
            const jsonData = this.toolsService.xorEncryptDecrypt(encryptedData, secretKey);

            // Parsear los datos JSON
            const dataEncode: Encode = JSON.parse(jsonData);

            if (dataEncode?.token) {
              this.confirmEmail(dataEncode.token, dataEncode.email!);
            }

          } catch (error) {
            console.error('Error procesando los datos:', error);
          }
        }
      });
    }

  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  confirmEmail(token: string, email: string): void {
    this.loading.set(true);
    this.email.set(email);
    const dataSend: any = {
      token: token,
    };

    if (email) {
      dataSend.email = email
    }

    this.authService.confirmEmail(dataSend)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.emailVerified.set(res.data.user.emailVerified!);
          }
        },
        error: (err) => {
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        }
      });
  }

  resendVerificationEmail(): void {
    if (this.authService.user()) {
      const token = this.authService.token()!;

      if (!token) {
        this.authService.logout();
      }

      //this.confirmEmail(token);
    }
  }

  redirectHome(): void {
    const route = '/';
    this.router.navigateByUrl(`${route}`).then(() => {
      //window.location.reload();
    });
  }

  // input class
  buttonClass() {
    return Tools.buttonClass();
  }

}
