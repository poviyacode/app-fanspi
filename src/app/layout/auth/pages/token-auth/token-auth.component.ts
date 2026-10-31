import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Site } from '@interfaces/site';
import { AuthService } from '@services/auth.service';
import { SiteService } from '@services/site.service';
import { SpinnerService } from '@services/spinner.service';
import { Subject, takeUntil } from 'rxjs';

export interface Encode {
  token?: string;
  username?: string;
  password?: string;
  route?: string;
  SiteMain?: Site;
};

@Component({
  selector: 'app-token-auth',
  imports: [],
  templateUrl: './token-auth.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './token-auth.component.scss'
})
export default class TokenAuthComponent {

  isBrowser: boolean;
  isServer: boolean;

  private destroy$ = new Subject<void>();

  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private spinnerService = inject(SpinnerService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    if (this.isBrowser) {

      localStorage.clear();
      sessionStorage.clear();

      this.loginToken();
    }

  }

  ngOnInit() {

  }

  loginToken() {

    this.spinnerService.start();

    this.activatedRoute.queryParams.subscribe(params => {

      const encodedData = params['data'];
      if (encodedData) {
        try {
          const secretKey = 'your-secret-key';

          // Decodificar Base64
          const encryptedData = atob(encodedData);

          // Desencriptar usando XOR
          const jsonData = this.xorEncryptDecrypt(encryptedData, secretKey);

          // Parsear los datos JSON
          const dataEncode: Encode = JSON.parse(jsonData);
          const token = dataEncode.token;
          const route = dataEncode.route;
          const SiteMain = dataEncode.SiteMain!;
          this.authService.addUserVisit({ SiteMain: SiteMain, active: false });

          if (dataEncode?.token) {
            const data = {
              token: token
            };
            this.authService.verifyToken(data)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (res) => {
                  if (res.ok === true) {
                    this.router.navigateByUrl(`${route}`);
                    // this.router.navigateByUrl(`${route}`).then(() => {
                    //   window.location.reload();
                    // });
                  }
                },
                error: (err) => {
                  this.spinnerService.close();
                },
                complete: () => {
                  this.spinnerService.close();
                  console.log('Request completed');
                }
              });
          }

        } catch (error) {
          console.error('Error procesando los datos:', error);
        }
      }
    });
  }

  xorEncryptDecrypt(input: string, key: string): string {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      result += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }
}
