import { CommonModule } from '@angular/common';
import { Component, ComponentRef, effect, EventEmitter, inject, Output, signal, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AgeValidator, ConfirmPasswordValidator, MatchCurrentPasswordValidator, NumericValidator } from '@core/common/custom-validators.ts';
import { UIStyles } from '@core/common/uistyles';
import { environment } from '@environments/environment';
import { User, UserRole } from '@interfaces/user';
import { SpinnerService } from '@services/spinner.service';
import { ToastService } from '@services/toast.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { CountryService } from '@services/country.service';
import { PostMediaService } from '@services/post-media.service';
import { UserService } from '@services/user.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { SubscriptionService } from '@services/subscription.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { EmailService } from '@services/email.service';
import { ToolsService } from '@services/tools.service';
import NotificationSettingComponent from '../notification-setting/notification-setting.component';
import { TokenService } from '@services/token.service';
import { Token } from '@interfaces/token';
import CodeVerificationComponent from '@shared/code-verification/code-verification.component';
import { DialogService } from '@services/dialog.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-account-setting',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    IconDirective,
  ],

  templateUrl: './account-setting.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./account-setting.component.scss']
})
export default class AccountSettingComponent {

  loading: boolean;
  domain = `https://${environment.domain}`;

  //username
  existUsername = false;
  myformUsername: FormGroup;

  //email
  existEmail = false;
  myFormEmail: any;

  //password
  existPassword = false;
  myformPasword: FormGroup;

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();

  //  component
  private codeVerificationComponentRef: ComponentRef<CodeVerificationComponent> | null = null;

  private fb = inject(FormBuilder);
  public router = inject(Router);
  private spinnerService = inject(SpinnerService);
  private toastService = inject(ToastService);
  private postMediaService = inject(PostMediaService);
  private userService = inject(UserService);
  private countryService = inject(CountryService);
  public authService = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);
  public emailService = inject(EmailService);
  public toolsService = inject(ToolsService);
  public tokenService = inject(TokenService);
  public dialogService = inject(DialogService);

  ngOnInit(): void {

    if (this.authService.user()) {
      this.createFormUsernameControls();
      this.createFormPasswordControls();
      this.createFormEmailControls();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    //component
    this.clearCodeVerificationComponent();
  }

  logout() {
    this.subscriptionService.resetSubscribersUserJoin();
    this.authService.logout();
  }

  // username
  createFormUsernameControls() {
    this.myformUsername = new FormGroup({
      username: new FormControl(this.authService.user()!.username ? this.authService.user()!.username : '', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+$/)]),
    });
  }

  onSubmitUsername(): void {
    if (this.myformUsername.valid) {
      const data = {
        username: this.myformUsername.value.username.trim().toLowerCase()
      }
      this.spinnerService.start();

      this.userService.updateUsername(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res?.exist === true) {
              this.existUsername = true;
            } else {
              const updatedUser = {
                ...this.authService.user(),
                username: this.myformUsername.value.username.toLowerCase()
              };
              this.authService.addUser(updatedUser);
              this.onCloseModal();
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
  }

  onChangeEditUsername() {
    this.dialogService.toggleModal('username');
    this.myformUsername.patchValue({
      username: this.authService.user()!.username,
    });
  }

  //email
  createFormEmailControls() {
    this.myFormEmail = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  async onConfirmEmail() {

    this.spinnerService.start();
    const data: any = {
      category: "VERIFY_EMAIL",
      type: "EMAIL",
      email: this.authService.user()?.email
    }

    const res = await this.tokenService.create(data);
    if (res && res.token) {
      this.tokenService.addToken(res.token);
      this.onCodeVedrificationModal();
    } else {
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
    }
    this.spinnerService.close();
  }

  async onSubmitChangeEmail() {

    this.onCloseModal();

    if (this.myFormEmail.valid) {

      const email = this.myFormEmail.value.email.trim().toLowerCase();

      if (email === this.authService.user()?.email) {
        this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        return;
      }

      this.spinnerService.start();

      const dataSend = {
        newEmail: email,
        currentEmail: this.authService.user()?.email
      }
      this.userService.verifyEmail(dataSend)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (res) => {
            const data: any = {
              category: "CHANGE_EMAIL",
              type: "EMAIL",
              email
            }
            const resToken = await this.tokenService.create(data);
            if (resToken && resToken.token) {
              this.tokenService.addToken(resToken.token);
              this.onCodeVedrificationModal();
            } else {
              this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
            }
          },
          error: (err) => {
            this.spinnerService.close();
            this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
          },
          complete: () => {
            this.spinnerService.close();
          }
        });
    }
  }

  onChangeEditEmail() {
    this.dialogService.toggleModal('email');
    this.myformUsername.patchValue({
      username: this.authService.user()!.username,
    });
  }

  // password
  createFormPasswordControls() {
    this.myformPasword = new FormGroup({
      passwordCurrent: new FormControl(null, [
        Validators.required,
        MatchCurrentPasswordValidator(this.authService.user()?.password!)
      ]),
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

  onSubmitPassword(): void {
    if (this.myformPasword.valid) {
      const data = {
        password: this.myformPasword.getRawValue().password
      }
      this.spinnerService.start();
      const userId = this.authService.user()?._id;
      this.userService.update(userId, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (res) => {
            this.authService.logout();
          },
          error: (err) => {
            this.spinnerService.close();
            this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
          },
          complete: () => {
            this.spinnerService.close();
          }
        });
    }
  }

  onChangeEditPassword() {
    this.dialogService.toggleModal('password');
    this.myformPasword.patchValue({
      username: this.authService.user()!.username,
    });
  }

  // delete account
  async onDeleteAccount() {

    this.spinnerService.start();

    const email = this.authService.user()?.email;

    const data: any = {
      category: "DELETE_ACCOUNT",
      type: "EMAIL",
      email
    }

    const res = await this.tokenService.create(data);
    if (res && res.token) {
      this.tokenService.addToken(res.token);
      this.toastService.start({ type: 'success', message: 'emailSentForVerification' });
      this.onCodeVedrificationModal();
    } else {
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
    }
    this.spinnerService.close();

  }

  onPersonal(): void {
    this.router.navigate(['admin/personal']);
  }

  // roles
  getRoles(role: string): boolean {
    return !!this.authService.user()?.roles?.includes(role as UserRole);
  }

  onSubmitChangeRole(role: string): void {

    const data = {
      roles: [role]
    }
    this.spinnerService.start();

    this.userService.updateRoles(this.authService.user()!._id!, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (res) => {
          const updatedUser = {
            ...this.authService.user(),
            roles: [role]
          };
          this.authService.addUser(updatedUser);
          const updatedUserProfile: any = {
            ...this.userService.userProfile(),
            roles: [role]
          };
          this.userService.addUserProfile(updatedUserProfile);
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

  // close
  onCloseModal() {
    this.dialogService.closeModal();
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
