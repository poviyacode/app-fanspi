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
import { LovenseSessionService } from '@services/lovense-session.service';
import { LovenseProductService } from '@services/lovense-product.service';
import { LovenseProduct } from '@interfaces/lovenseProduct';
import { Membership } from '@interfaces/membership';
import { MembershipService } from '@services/membership.service';

@Component({
  selector: 'app-lovense-setting',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    IconDirective,
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
  templateUrl: './lovense-setting.component.html',
  styleUrl: './lovense-setting.component.scss',
})
export default class LovenseSettingComponent {

  loading = signal(false);
  lovenseControls = signal<Membership[]>([]);
  urlImageQr = signal<string>('');
  private destroy$ = new Subject<void>();

  //inyection
  public lovenseSessionService = inject(LovenseSessionService);
  public lovenseProductService = inject(LovenseProductService);
  private spinnerService = inject(SpinnerService);
  public authService = inject(AuthService);
  public membershipService = inject(MembershipService);

  ngOnInit() {
    this.getSession();
  }

  //----------------------------------------generate QR ------------------------------------------//
  generateQR() {
    this.spinnerService.start();
    this.lovenseSessionService.generateQr({}).subscribe({
      next: (res) => {
        this.urlImageQr.set(res.data.qr);
      },
      error: (err) => {
        this.spinnerService.close();
      },
      complete: () => {
        this.spinnerService.close();
      }
    });
  }

  disconnectAllToys() {
    this.spinnerService.start();
    const UserId = this.authService.user()?._id || '';
    this.lovenseSessionService.disconnectAllToys(UserId).subscribe({
      next: (res) => {
        this.lovenseSessionService.resetLovenseSession();
        this.lovenseSessionService.addLovenseSession(res);
      },
      error: (err) => {
        this.spinnerService.close();
      },
      complete: () => {
        this.spinnerService.close();
      }
    });
  }

  getSession() {
    this.spinnerService.start();
    const UserId = this.authService.user()?._id || '';
    this.lovenseSessionService.getSession(UserId).subscribe({
      next: (res) => {
        const { session, products, memberships } = res;
        this.lovenseSessionService.resetLovenseSession();
        this.lovenseProductService.resetLovenseProducts();
        this.lovenseSessionService.addLovenseSession(session);
        this.lovenseProductService.addLovenseProducts(products);


        const { lovenseControls } = memberships;
        if (lovenseControls && lovenseControls!.length > 0) {
          this.lovenseControls.set(lovenseControls!);
        }
      },
      error: (err) => {
        this.spinnerService.close();
      },
      complete: () => {
        this.spinnerService.close();
      }
    });
  }

  onAddToyLovense(item: LovenseProduct) {
    const lovenseProductId = item._id;
    this.spinnerService.start();
    this.membershipService.addToyLovense({ lovenseProductId }).subscribe({
      next: (res) => {
        this.getSession();
      },
      error: (err) => {
        this.spinnerService.close();
      },
      complete: () => {
        this.spinnerService.close();
      }
    });
  }

  onActivate(item: Membership) {
    const { quantyTime, lovenseConfig } = item;
    this.spinnerService.start();
    const UserId = this.authService.user()?._id || '';
    const data = {
      UserId: UserId,
      level: lovenseConfig?.vibration || '',
      timeSec: quantyTime,
      toyId: item.lovenseConfig?.LovenseProduct.code
    }

    this.lovenseSessionService.sendCommandCloud(data).subscribe({
      next: (res) => {
        console.log(res)
      },
      error: (err) => {
        this.spinnerService.close();
      },
      complete: () => {
        this.spinnerService.close();
      }
    });
  }

  onStop(item: LovenseProduct) {
    this.spinnerService.start();
    const UserId = this.authService.user()?._id || '';
    const data = {
      UserId: UserId,
      toyId: item.code
    }
    this.lovenseSessionService.stopCommandCloud(data).subscribe({
      next: (res) => {

      },
      error: (err) => {
        this.spinnerService.close();
      },
      complete: () => {
        this.spinnerService.close();
      }
    });
  }

  onAddPackage() {
    this.spinnerService.start();
    this.membershipService.seedDefaultLovenseOptions().subscribe({
      next: (res) => {
        this.lovenseControls.set(res!);
      },
      error: (err) => {
        this.spinnerService.close();
      },
      complete: () => {
        this.spinnerService.close();
      }
    });
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

  buttonPrimaryClass() {
    return UIStyles.buttonPrimaryClass();
  }

  buttonSecondaryClass() {
    return UIStyles.buttonSecondaryClass();
  }

  buttonTertiaryClass() {
    return UIStyles.buttonTertiaryClass();
  }

  cardModalClass() {
    return UIStyles.cardModalClass();
  }
}
