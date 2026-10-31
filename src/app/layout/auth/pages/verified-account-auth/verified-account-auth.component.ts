import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Tools } from '@core/common/tools';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { EmailService } from '@services/email.service';
import { TagService } from '@services/tag.service';
import { ToastService } from '@services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-verified-account-auth',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    CommonModule,
    RouterModule
  ],
  templateUrl: './verified-account-auth.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './verified-account-auth.component.scss'
})
export default class VerifiedAccountAuthComponent {

  myForm: FormGroup;
  isVerifying = false;
  verificationCode: Number;
  private destroy$ = new Subject<void>();

  private tagService = inject(TagService);
  public authService = inject(AuthService);
  private emailService = inject(EmailService);
  private router = inject(Router);
  public toastService = inject(ToastService);

  ngOnInit(): void {
    this.createFormControls();

    if (!this.authService.user()?.emailVerified) {
      //this.sendEmail();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {
    this.myForm = new FormGroup({
      verificationCode: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(6)])
    });
  }

  // Function to verify the email with the entered code
  verifyEmail() {

    if (this.authService.user()?.emailVerified) {
      return;
    }

    if (this.myForm.invalid) return;

    this.isVerifying = true;
    const code = Number(this.myForm.value.verificationCode);

    if (code === this.verificationCode) {
      const data = {

      };

      this.authService.verifiedAccount(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.router.navigateByUrl('/');
          },
          error: (err) => {

          },
          complete: () => {
            this.myForm.enable();
          }
        });
    } else {
      this.myForm.enable();
    }
  }

  // email
  sendEmail(): void {
    // Generate a random 6-digit verification code
    this.verificationCode = Math.floor(100000 + Math.random() * 900000);

    const correo = {
      from: `"Yuvinka" <support@fanspi.com>`,
      to: this.authService.user()?.email, // Correo del usuario
      subject: `${this.verificationCode} - Yuvinka Sign-in Verification`, // Asunto del correo
      html: `
        <div style="max-width: 600px; margin: auto; padding: 20px; font-family: 'Arial', sans-serif; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05); color: #333333; line-height: 1.6;">
     
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://yuvinka.com/public/logo/icon.png" alt="Logo" style="max-width: 150px; border-radius: 8px;" />
            <h1 style="font-size: 24px; font-weight: bold; color: #F00034; margin-top: 10px;">Email Verification</h1>
          </div>
    
          <div style="padding: 0 20px;">
            <p style="margin: 0; color: #333333; font-size: 16px;">Hello,</p>
            <p style="color: #333333; font-size: 16px; margin-top: 10px;">Please verify your email using the code below:</p>
  
            <div style="text-align: center; margin: 20px 0; padding: 15px; background-color: #FFEBEF; font-size: 28px; font-weight: bold; letter-spacing: 3px; border-radius: 8px; color: #F00034;">
              ${this.verificationCode}
            </div>
    
            <p style="color: #333333; font-size: 16px; margin-top: 10px;">Enter this code on the verification page to complete your registration.</p>
          </div>
    
          <div style="background-color: #FFEBEF; padding: 15px; font-size: 14px; color: #750019; text-align: center; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; margin-top: 20px;">
            <p style="margin: 0;">Need help? Use this ID: <span style="color: #F00034; font-weight: bold;">em_ABC123456</span></p>
            <p style="margin: 5px 0 0;">You can also contact us at <a href="https://t.me/supporrt" style="color: #F00034; text-decoration: none; font-weight: bold;">@support</a>.</p>
            <p style="margin: 5px 0 0;">&copy; 2023 Yuvinka USA. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    this.emailService.create(correo).then((res: any) => {
      this.toastService.start({ type: 'success', message: 'verificationEmailSent' });
    });
  }


  // input class
  inputClass(formGroup: FormGroup, controlName: string) {
    return Tools.inputClass(formGroup, controlName);
  }

  textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return Tools.textareaClass(formGroup, controlName, height);
  }
}
