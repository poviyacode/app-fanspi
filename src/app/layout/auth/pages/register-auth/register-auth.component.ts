import { Component, ComponentRef, inject, Inject, PLATFORM_ID, signal, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { CommonModule, Location, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ToastService } from '@services/toast.service';
import { environment } from '@environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { AgeValidator, ConfirmPasswordValidator } from '@core/common/custom-validators.ts';
import { Country } from '@interfaces/country';
import { StateCity } from '@interfaces/stateCity';
import { EmailService } from '@services/email.service';
import { Tools } from '@core/common/tools';
import { identity, Subject, takeUntil } from 'rxjs';
import { CountryService } from '@services/country.service';
import { Meta, Title } from '@angular/platform-browser';
import { IconDirective } from '@directive/coin-svg.directive';
import { ToolsService } from '@services/tools.service';
import { TokenService } from '@services/token.service';
import { SpinnerService } from '@services/spinner.service';
import CodeVerificationComponent from '@shared/code-verification/code-verification.component';
import { DialogService } from '@services/dialog.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-register-auth',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    CommonModule,
    RouterModule,
    IconDirective
  ],
  providers: [],
  templateUrl: './register-auth.component.html',
  styleUrl: './register-auth.component.scss'
})
export default class RegisterAuthComponent {
  isBrowser: boolean;

  isLoading = false;

  exist = false;
  msg = false;
  useExists: boolean;
  ipapi: any;

  countries = signal<Country[] | null>(null);
  stateCitiesAll: StateCity[];

  myForm: FormGroup;

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();

  //  component
  private codeVerificationComponentRef: ComponentRef<CodeVerificationComponent> | null = null;

  genderArray: any[] = [
    { value: 'MAN', name: 'man' }, { value: 'WOMAN', name: 'woman' },
  ];

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

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private location = inject(Location);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  private countryService = inject(CountryService);
  private title = inject(Title);
  public emailService = inject(EmailService);
  public toolsService = inject(ToolsService);
  public tokenService = inject(TokenService);
  private spinnerService = inject(SpinnerService);
  public dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private meta = inject(Meta);
  constructor() {
    this.title.setTitle('Register');
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.authService.user()) {
      this.router.navigateByUrl('/');
    }

    this.meta.updateTag({ name: 'title', content: 'Crear Cuenta | fanspi Academy' });
    this.meta.updateTag({ name: 'description', content: 'Regístrate gratis y accede a cursos premium...' });
    this.meta.updateTag({ property: 'og:title', content: 'Únete a fanspi Academy' });

    this.findAllCountries();
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
      alias: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      gender: new FormControl('WOMAN', Validators.required),
      age: new FormControl(18, [Validators.required, Validators.minLength(2), Validators.maxLength(2), AgeValidator]),
      country: new FormControl('US', Validators.required),
      terms: new FormControl(false, Validators.requiredTrue),
      password: new FormControl(null, Validators.compose([
        // 1. Password Field is Required
        Validators.required,
        // 2. check whether the entered password has a number
        //CustomValidators.patternValidator(/\d/, { hasNumber: true }),
        // 3. check whether the entered password has upper case letter
        //CustomValidators.patternValidator(/[A-Z]/, { hasCapitalCase: true }),
        // 4. check whether the entered password has a lower-case letter
        //CustomValidators.patternValidator(/[a-z]/, { hasSmallCase: true }),
        // 5. check whether the entered password has a special character
        //CustomValidators.patternValidator(/[ [!@#$%^&*()_+-=[]{};':"|,.<>/?]/](<mailto:!@#$%^&*()_+-=[]{};':"|,.<>/?]/>), { hasSpecialCharacters: true }),
        // 6. Has a minimum length of 8 characters
        Validators.minLength(6)])
      ),
      confirmPassword: new FormControl(null, [Validators.required])
    },
      {
        validators: ConfirmPasswordValidator("password", "confirmPassword")
      });

    let lang = this.toolsService.language() || window.navigator.language.split('-')[0];
    this.myformLanguage = new FormGroup({
      language: new FormControl(lang, Validators.required),
    });

  }

  getPasswordStrength(password: string): number {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9!@#$%^&*]+/)) strength += 25;
    return strength;
  }

  getPasswordStrengthLabel(password: string): string {
    const strength = this.getPasswordStrength(password);
    if (strength < 50) return 'passwordWeak';
    if (strength < 75) return 'passwordMedium';
    return 'passwordStrong';
  }


  register() {
    this.spinnerService.start();

    const country = this.countries()?.find(item => item.code == this.myForm.value.country);

    const data = {
      alias: this.myForm.value.alias,
      email: this.myForm.value.email.trim().toLowerCase(),
      gender: this.myForm.value.gender,
      age: Number(this.myForm.value.age),
      Country: country?._id,
      password: this.myForm.value.password.trim(),
    };

    this.myForm.disable();

    this.authService.register(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (res) => {
          if (res.data.useExists!) {
            this.toastService.start({ type: 'error', message: 'emailAlreadyExists' });
            this.useExists = true;
            this.myForm.enable();

          } else if (res.ok == true) {
            //this.playSound();
            const email = this.authService.user()?.email!;
            await this.createToken(email);
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.myForm.enable();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.spinnerService.close();
        }
      });
  }

  async createToken(email: string) {

    if (!email) {
      this.router.navigateByUrl('/');
      return;
    }

    this.spinnerService.spinner();
    const data: any = {
      category: "REGISTER_ACCOUNT",
      type: "EMAIL",
      email
    }

    const res = await this.tokenService.create(data);
    if (res && res.token) {
      this.tokenService.addToken(res.token);
      this.onCodeVedrificationModal();
    }

    //this.router.navigateByUrl('/');

    this.spinnerService.close();
  }

  async findAllCountries() {
    const countries = await this.countryService.findAllDatting();
    this.countries.set(countries);
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

  // button class
  buttonClass() {
    return Tools.buttonClass();
  }

  buttonClassForm(formGroup: boolean) {
    return Tools.buttonClassForm(formGroup);
  }

  playSound() {
    const audio = new Audio('public/sounds/orgasm1.mp3');
    audio.play();
  }

}

