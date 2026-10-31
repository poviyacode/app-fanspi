import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, EventEmitter, inject, Output, PLATFORM_ID, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
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
import { UserService } from '@services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { DialogService } from '@services/dialog.service';

@Component({
  selector: 'app-code-verification',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    CommonModule,
    RouterModule,
    IconDirective
  ],
  animations: [
    trigger('flyInOut', [
      state('in', style({ transform: 'translateX(0) scale(1)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateX(0) scale(0.95)', opacity: 0 }),
        animate('400ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({ transform: 'translateX(0) scale(1)', opacity: 1 }))
      ]),
      transition('* => void', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0) scale(0.95)', opacity: 0 }))
      ]),
    ]),
  ],
  templateUrl: './code-verification.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './code-verification.component.scss'
})
export default class CodeVerificationComponent {

  isBrowser: boolean;
  isServer: boolean;

  myForm: FormGroup;
  private isTokenSent = signal(false);
  public errorMessage = signal(false);
  public successMessage = signal(false);

  @Output() closeModal = new EventEmitter<void>();
  private destroy$ = new Subject<void>();

  public authService = inject(AuthService);
  private userService = inject(UserService);
  private spinnerService = inject(SpinnerService);
  private router = inject(Router);
  public toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private title = inject(Title);
  private toolsService = inject(ToolsService);
  public tokenService = inject(TokenService);
  public dialogService = inject(DialogService);

  constructor() {
    this.title.setTitle('Enter your Verification Code');
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
  }

  ngOnInit(): void {
    this.createFormControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {
    this.myForm = new FormGroup({
      code: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]),
    });
  }

  onVerifyCode() {

    if (this.isTokenSent()) {
      return;
    }

    const { code } = this.myForm.value;

    this.myForm.reset();
    this.myForm.disable();

    this.spinnerService.start();

    if (this.myForm.invalid) {
      this.spinnerService.close();
      this.myForm.enable();
      return;
    }

    const data: any = {
      code: code,
      category: this.tokenService.token()?.category,
      User: this.tokenService.token()?.User
    };

    this.onCloseModal();

    this.tokenService.verifyCode(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && res.ok) {
            this.successMessage.set(true);

            if (this.tokenService.token()?.category === 'PASSWORD_RESET' && !this.authService.user()) {
              this.router.navigateByUrl('/auth/reset-password');
            } else if (this.tokenService.token()?.category === 'REGISTER_ACCOUNT' && this.authService.user()) {
              this.verifyEmail();
            } else if (this.tokenService.token()?.category === 'VERIFY_EMAIL' && this.authService.user()) {
              this.verifyEmail();
            } else if (this.tokenService.token()?.category === 'CHANGE_EMAIL' && this.authService.user()) {
              this.updateEmail();
            } else if (this.tokenService.token()?.category === 'DELETE_ACCOUNT' && this.authService.user()) {
              this.onDeleteAccount();
            }

          } else {
            this.errorMessage.set(true);
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.myForm.enable();
          this.toastService.start({ type: 'error', message: 'invalidCode' });
        },
        complete: () => {
          this.myForm.enable();
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        }
      });
  }

  verifyEmail() {

    this.spinnerService.start();

    if (this.authService.user()?.emailVerified) {
      return;
    }

    const data = {};

    this.authService.verifiedAccount(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.authService.updateUser({ emailVerified: res.emailVerified })
          if (this.tokenService.token()?.category === 'REGISTER_ACCOUNT') {
            //this.router.navigateByUrl('/');
          } else if (this.tokenService.token()?.category === 'VERIFY_EMAIL') {
            //this.router.navigateByUrl('/admin/setting/account');
          }
          this.tokenService.resetToken();

        },
        error: (err) => {
          this.spinnerService.close();
        },
        complete: () => {
          this.myForm.enable();
          this.spinnerService.close();
        }
      });
  }

  updateEmail() {

    if (!this.tokenService.token()?.email) {
      this.router.navigateByUrl('/admin/setting/account');
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
    }

    this.spinnerService.start();

    const data = {
      email: this.tokenService.token()?.email
    };

    this.userService.updateEmail(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.authService.updateUser({ email: res.email })
          this.router.navigateByUrl('/admin/setting/account');
          this.tokenService.resetToken();

        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.myForm.enable();
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        }
      });
  }


  onDeleteAccount(): void {

    const data = {
      status: 'DELETE'
    }
    const userId = this.authService.user()?._id;

    this.userService.update(userId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            if (res.status === 'DELETE') {
              this.authService.logout();
              this.toastService.start({ type: 'error', message: 'accountDeleted' });
            }
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

  onReturn() {
    if (this.tokenService.token()?.category === 'PASSWORD_RESET' && !this.authService.user()) {
      this.router.navigateByUrl('/auth/forgot-password');
    } else if (this.tokenService.token()?.category === 'REGISTER_ACCOUNT' && this.authService.user()) {
      this.router.navigateByUrl('/');
    } else if (this.tokenService.token()?.category === 'VERIFY_EMAIL' && this.authService.user()) {
      this.router.navigateByUrl('/admin/setting/account');
    } else if (this.tokenService.token()?.category === 'CHANGE_EMAIL' && this.authService.user()) {
      this.router.navigateByUrl('/admin/setting/account');
    } else if (this.tokenService.token()?.category === 'DELETE_ACCOUNT' && this.authService.user()) {
      this.router.navigateByUrl('/admin/setting/account');
    }

    this.onCloseModal();
  }

  onCloseModal() {
    this.closeModal.emit();
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

  modalClass() {
    return Tools.modalClass();
  }

  buttonClassForm(value: boolean) {
    return Tools.buttonClassForm(value);
  }

}

