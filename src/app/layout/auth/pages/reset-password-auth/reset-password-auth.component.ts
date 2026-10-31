import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, inject, PLATFORM_ID, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmPasswordValidator } from '@core/common/custom-validators.ts';
import { Tools } from '@core/common/tools';
import { IconDirective } from '@directive/coin-svg.directive';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { EmailService } from '@services/email.service';
import { SpinnerService } from '@services/spinner.service';
import { TagService } from '@services/tag.service';
import { ToastService } from '@services/toast.service';
import { TokenService } from '@services/token.service';
import { ToolsService } from '@services/tools.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-reset-password-auth',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    CommonModule,
    RouterModule,
    IconDirective
  ],
  templateUrl: './reset-password-auth.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './reset-password-auth.component.scss'
})
export default class ResetPasswordAuthComponent {

  isBrowser: boolean;
  isServer: boolean;

  myForm: FormGroup;
  token: string;
  private isRequestSent = false;

  private destroy$ = new Subject<void>();

  private tagService = inject(TagService);
  public authService = inject(AuthService);
  private emailService = inject(EmailService);
  private spinnerService = inject(SpinnerService);
  private router = inject(Router);
  public toastService = inject(ToastService);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private title = inject(Title);
  private toolsService = inject(ToolsService);
  private activatedRoute = inject(ActivatedRoute);
  private tokenService = inject(TokenService);

  constructor() {
    this.title.setTitle('Login');
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    this.activatedRoute.queryParams.subscribe(params => {

      this.token = params['token'];

    });
  }

  ngOnInit(): void {
    this.createFormControls();

    if (!this.tokenService.token()) {
      this.router.navigateByUrl('auth/login');
    } else if (!this.authService.user()?.emailVerified) {
      //this.sendEmail();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {
    this.myForm = new FormGroup({
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
  }

  onRequestPasswordReset() {

    if (this.isRequestSent) {
      return;
    }

    const { password } = this.myForm.value;
    this.myForm.reset();
    this.myForm.disable();

    this.spinnerService.start();

    if (this.myForm.invalid) {
      this.spinnerService.close();
      this.myForm.enable();
      return;
    }

    const dataSend = {
      Token: this.tokenService.token()?._id,
      User: this.tokenService.token()?.User,
      newPassword: password
    };

    this.authService.resetPassword(dataSend)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.tokenService.resetToken();
          this.router.navigateByUrl('auth/login');
        },
        error: (err) => {
          this.myForm.enable();
          this.spinnerService.close();
          this.isRequestSent = false;
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.myForm.enable();
          this.spinnerService.close();
          this.isRequestSent = false;
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
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
