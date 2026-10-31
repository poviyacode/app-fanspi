import { Component, EventEmitter, inject, Inject, Output, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { CommonModule, Location, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ToastService } from '@services/toast.service';
import { environment } from '@environments/environment';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { Tools } from '@core/common/tools';
import { SpinnerService } from '@services/spinner.service';
import { DialogService } from '@services/dialog.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { IconDirective } from '@directive/coin-svg.directive';

@Component({
  selector: 'app-modal-login-auth',
  imports: [
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
  templateUrl: './modal-login-auth.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './modal-login-auth.component.scss'
})
export class ModalLoginAuthComponent {

  isBrowser: boolean;
  isServer: boolean;

  msg = false;
  myForm: FormGroup;

  @Output() closeModal = new EventEmitter<void>();
  private destroy$ = new Subject<void>();

  private location = inject(Location);
  public toastService = inject(ToastService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  public dialogService = inject(DialogService);

  constructor() {
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
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(3)]),
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
            this.dialogService.closeModal();
            this.toastService.start({ type: 'success', message: 'loginSuccess' });
            //location.reload();
          } else {
            this.toastService.start({ type: 'error', message: 'emailPasswordIncorrect' });
            this.myForm.enable();
          }
        },
        error: (err) => {
          console.log('Error');
        }
      });
  }

  // close
  onCloseModal() {
    this.closeModal.emit(); // Notifica al padre que el modal se cerró
  }

  goBack(): void {
    this.location.back();
  }

  // audio
  playSound() {
    const audio = new Audio('public/sounds/orgasm1.mp3');
    audio.play();
  }

  // input class
  inputClass(formGroup: FormGroup, controlName: string) {
    return Tools.inputClass(formGroup, controlName);
  }

  textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return Tools.textareaClass(formGroup, controlName, height);
  }

  cardModalClass() {
    return Tools.cardModalClass();
  }

  buttonClass() {
    return Tools.buttonClass();
  }

}


