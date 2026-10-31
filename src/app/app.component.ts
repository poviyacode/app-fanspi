import { Component, computed, Inject, PLATFORM_ID, ViewContainerRef, inject, ApplicationRef, NgZone, HostListener, effect, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SocketService } from '@services/socket.service';
import { AuthService } from '@services/auth.service';
import { first } from 'rxjs/operators';
import { VersionService } from '@services/version.service';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { environment } from '@environments/environment';
import { ToastService } from '@services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { SpinnerService } from '@services/spinner.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { ToolsService } from '@services/tools.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CustomTranslatePipe,
    IconDirective
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.scss'
})
export class AppComponent {

  title = 'app-yuvinka';
  isStable: boolean = true;
  isBrowser: boolean;
  isServer: boolean;

  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private applicationRef = inject(ApplicationRef);
  private versionService = inject(VersionService);
  private platformId = inject(PLATFORM_ID);;
  public toastService = inject(ToastService);
  public spinnerSevice = inject(SpinnerService);
  public toolsService = inject(ToolsService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    if (this.isBrowser) {
      //this.versionService.checkForUpdates();
    }

    this.monitorAppStability();
  }

  ngOnInit() {
    if (this.isBrowser) {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (saved === 'dark' || (!saved && prefersDark)) {
        this.toggleDarkMode(true);
      }
    }
  }

  toggleDarkMode(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    // Opcional: guardar preferencia
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  @HostListener('window:storage', ['$event'])
  handleStorageEvent(event: StorageEvent) {
    //console.log(event.key);
    // Verificamos si la clave eliminada es la de nuestra sesión
    if (event.newValue === null) {
      this.router.navigate(['/auth']);
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    if (environment.production) {
      //event.preventDefault();
    }
  }

  private monitorAppStability(): void {
    this.applicationRef.isStable.pipe(
      first(isStable => isStable)
    ).subscribe(() => {
      this.isStable = true;
      if (this.authService.user()!) {
        this.socketService.socketConnect(this.authService.token());
      }
    });
  }

  // lang
  changeLangDefault() {

    const supportedLanguages = ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'pt_BR', 'ru', 'tr', 'zh'];

    let lang = 'en';
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const storedLang = localStorage.getItem('language')!;
      if (storedLang && supportedLanguages.includes(storedLang)) {
        lang = storedLang;
      } else {
        const langNavigator = window.navigator.language || 'en';
        const langArray = langNavigator.split('-');
        const browserLang = langArray[0];

        if (supportedLanguages.includes(browserLang)) {
          lang = browserLang;
        }
      }
    }

    this.toolsService.languageCreate(lang);
    this.translate.use(lang).subscribe({
      next: () => {
        this.toolsService.languageCreate(lang);
      },
      error: (err) => {
        console.error(`Error"${lang}":`, err);
      }
    });
  }

}
