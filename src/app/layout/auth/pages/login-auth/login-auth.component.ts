import { Component, ComponentRef, EventEmitter, inject, Inject, Output, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { CommonModule, Location, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ToastService } from '@services/toast.service';
import { environment } from '@environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { Tools } from '@core/common/tools';
import { Title } from '@angular/platform-browser';
import { IconDirective } from '@directive/coin-svg.directive';
import { EmailService } from '@services/email.service';
import { ToolsService } from '@services/tools.service';
import { User } from '@interfaces/user';
import { DialogService } from '@services/dialog.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-login-auth',
  imports: [
    ReactiveFormsModule,
    CustomTranslatePipe,
    CommonModule,
    RouterModule,
    IconDirective
  ],
  templateUrl: './login-auth.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login-auth.component.scss'
})
export default class LoginAuthComponent {

  isBrowser: boolean;
  isServer: boolean;

  msg = false;
  myForm: FormGroup;
  dataEncode: any;

  @Output() closeModal = new EventEmitter<void>();
  private destroy$ = new Subject<void>();

  // language
  myformLanguage: FormGroup;
  langs: any[] = [
    { value: 'en', name: 'English' },
    { value: 'es', name: 'Español' },
    { value: 'pt_BR', name: 'Portugués' },
    { value: 'fr', name: 'Français' },
    { value: 'it', name: 'Italiano' },
    { value: 'de', name: 'Deutsch' },
    { value: 'ja', name: '日本語' },
    { value: 'ko', name: '한국어' },
    { value: 'ru', name: 'Pусский' },
    { value: 'tr', name: 'Türkçe' },
    { value: 'zh', name: '中文' },
  ];

  currentYear: number = new Date().getFullYear();

  private location = inject(Location);
  public toastService = inject(ToastService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private title = inject(Title);
  private toolsService = inject(ToolsService);
  public dialogService = inject(DialogService);
  private translate = inject(TranslateService);

  constructor() {
    this.title.setTitle('Login');
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

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
          this.dataEncode = JSON.parse(jsonData);

          if (this.dataEncode?.route) {
            this.loginEncode()
          }

        } catch (error) {
          console.error('Error procesando los datos:', error);
        }
      }
    });
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.createFormControls();
    }
  }

  ngOnDestroy(): void {
    https://app.airtm.com/payments
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {
    this.myForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(3)]),
    });

    let lang = this.toolsService.language() || window.navigator.language.split('-')[0];
    this.myformLanguage = new FormGroup({
      language: new FormControl(lang, Validators.required),
    });
  }

  login(): void {
    if (!this.myForm.valid) {
      this.toastService.start({ type: 'error', message: 'formInvalid' });
      return;
    }

    const { username, password } = this.myForm.value;

    const data = {
      username: username.trim().toLowerCase(),
      password: password.trim(),
    };

    this.myForm.disable();

    this.authService.login(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.ok === true) {
            const user: User = res.data.user;
            if (user.status === 'DELETE') {
              this.toastService.start({ type: 'error', message: 'accountDeleted' });
            }
            else if (user.status === 'SUSPENDED') {
              //this.authService.logout();
              const route = `/${user.username}`;
              this.router.navigateByUrl(`${route}`).then(() => {
                //window.location.reload();
              });
              this.toastService.start({ type: 'success', message: 'loginSuccess' });
            }
            else {
              this.toastService.start({ type: 'success', message: 'loginSuccess' });
              if (this.dataEncode) {
                this.loginEncode();
              } else {
                const route = '/';
                this.router.navigateByUrl(`${route}`).then(() => {
                  //window.location.reload();
                });
              }
            }

          } else {
            this.toastService.start({ type: 'error', message: 'emailPasswordIncorrect' });
          }
        },
        error: (err) => {
          this.myForm.enable();
          console.log('Error');
        },
        complete: () => {
          this.myForm.enable();
        }
      });
  }

  loginEncode() {
    if (this.authService.user()) {
      const secretKey = 'your-secret-key'; // Cambia esto por una clave segura

      // Datos del usuario
      const userData = {
        username: this.authService.user()?.username,
        password: this.authService.user()?.password,
        route: `${this.dataEncode.route}`,
        Site: environment.site
      };

      // Convertir datos a JSON y luego encriptar con XOR
      const jsonData = JSON.stringify(userData);
      const encryptedData = this.toolsService.xorEncryptDecrypt(jsonData, secretKey);

      // Codificar en Base64 para que sea seguro en la URL
      const encodedData = btoa(encryptedData);
    }
  }

  // close
  onCloseModal() {
    this.closeModal.emit(); // Notifica al padre que el modal se cerró
  }

  goBack(): void {
    this.location.back();
  }

  playSound() {
    const audio = new Audio('public/sounds/orgasm1.mp3');
    audio.play();
  }

  xorEncryptDecrypt(input: string, key: string): string {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      result += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  // lang
  changeLang(lang: string) {
    this.translate.use(lang).subscribe({
      next: () => {
        this.toolsService.languageCreate(lang);
      },
      error: (err) => {
        console.error(`Error"${lang}":`, err);
      }
    });
  }

  // input class
  inputClass(formGroup: FormGroup, controlName: string) {
    return Tools.inputClass(formGroup, controlName);
  }

  textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return Tools.textareaClass(formGroup, controlName, height);
  }

  buttonClass() {
    return Tools.buttonClass();
  }

}

