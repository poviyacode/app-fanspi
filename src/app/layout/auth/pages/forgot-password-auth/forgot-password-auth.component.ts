import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, ComponentRef, inject, PLATFORM_ID, signal, ViewChild, ViewContainerRef, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { Tools } from '@core/common/tools';
import { IconDirective } from '@directive/coin-svg.directive';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { EmailService } from '@services/email.service';
import { SpinnerService } from '@services/spinner.service';
import { TagService } from '@services/tag.service';
import { ToastService } from '@services/toast.service';
import { TokenService } from '@services/token.service';
import { ToolsService } from '@services/tools.service';
import CodeVerificationComponent from '@shared/code-verification/code-verification.component';
import { Subject, takeUntil } from 'rxjs';
import { flyInOutAnimation, slideInAnimation } from '@core/common/animations';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-forgot-password-auth',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    CommonModule,
    RouterModule,
    IconDirective
  ],
  animations: [
    flyInOutAnimation,
    slideInAnimation// Añade el trigger de animación
  ],
  templateUrl: './forgot-password-auth.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './forgot-password-auth.component.scss'
})
export default class ForgotPasswordAuthComponent {

  isBrowser: boolean;
  isServer: boolean;

  myForm: FormGroup;
  private isTokenSent = signal(false);

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();

  //  component
  private codeVerificationComponentRef: ComponentRef<CodeVerificationComponent> | null = null;

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

  public authService = inject(AuthService);
  private emailService = inject(EmailService);
  private spinnerService = inject(SpinnerService);
  private router = inject(Router);
  public toastService = inject(ToastService);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private title = inject(Title);
  private toolsService = inject(ToolsService);
  public tokenService = inject(TokenService);
  public dialogService = inject(DialogService);
  private translate = inject(TranslateService);

  constructor() {
    this.title.setTitle('Forgot your password?');
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.createFormControls();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {
    this.myForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });

    let lang = this.toolsService.language() || window.navigator.language.split('-')[0];
    this.myformLanguage = new FormGroup({
      language: new FormControl(lang, Validators.required),
    });
  }


  onRequestPasswordReset() {

    if (this.isTokenSent()) {
      return;
    }

    const { email } = this.myForm.value;

    this.myForm.reset();
    this.myForm.disable();

    this.spinnerService.start();

    if (this.myForm.invalid) {
      this.spinnerService.close();
      this.myForm.enable();
      return;
    }

    const data = { email };

    this.authService.requestPasswordReset(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.sendEmail) {
            this.tokenService.addToken(res.token);
            this.isTokenSent.set(true);

            this.onCodeVedrificationModal();

          } else {
            this.isTokenSent.set(false);
          }
        },
        error: (err) => {

          this.spinnerService.close();
          const error = err.error;

          if (error.description === 'USER_NOT_FOUND') {
            this.toastService.start({ type: 'error', message: 'userNotFound' });
          }
          this.isTokenSent.set(false);
          this.myForm.enable();
        },
        complete: () => {
          this.myForm.enable();
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'emailSentForVerification' });
        }
      });
  }

  //modal external
  onCodeVedrificationModal() {

    this.clearCodeVerificationComponent();

    const componentRef = this.viewContainerRef.createComponent(CodeVerificationComponent);

    this.codeVerificationComponentRef = componentRef;

    componentRef.instance.closeModal.subscribe(() => {
      console.log('The modal is closed from the child');
      this.clearCodeVerificationComponent();
      this.dialogService.closeModal();
    });

    this.dialogService.toggleModal('codeVerification');
  }

  private clearCodeVerificationComponent() {
    if (this.codeVerificationComponentRef) {
      this.codeVerificationComponentRef.destroy();
      this.codeVerificationComponentRef = null;
    }
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

  buttonClassForm(value: boolean) {
    return Tools.buttonClassForm(value);
  }
}
