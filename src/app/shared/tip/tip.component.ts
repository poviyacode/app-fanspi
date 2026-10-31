import { Component, computed, effect, inject, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MoneyService } from '../../services/money.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { TipService } from '../../services/tip.service';
import { UserCreditService } from '../../services/user-credit.service';
import { SpinnerService } from '../../services/spinner.service';
import { Router } from '@angular/router';
import { TransactionCreditService } from '../../services/transaction-credit.service';
import { NumericValidatorTip } from '../../core/common/custom-validators.ts';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

import { DynamicComponentService } from '../../services/dinamic-component.service';
import { DialogService } from '@services/dialog.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Money } from '@interfaces/money';
import { UserCredit } from '@interfaces/userCredit';
import { Tools } from '@core/common/tools';
import { DirectiveModule } from '@directive/directive.module';
import { Subject, takeUntil } from 'rxjs';
import { CreditPurchaseComponent } from '@shared/credit-purchase/credit-purchase.component';
import { SocketService } from '@services/socket.service';

interface Gift {
  id: number;
  name: string;
  image: string;
  price: number;
}

@Component({
  selector: 'app-tip',
  imports: [
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    DirectiveModule
  ],
  providers: [],
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
  templateUrl: './tip.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './tip.component.scss'
})
export class TipComponent {

  loading: boolean = false;
  myform: FormGroup;
  money: Money;
  userCredit: UserCredit | undefined;
  tip: any;

  selectedGift: Gift | null = null;

  gifts: Gift[] = [
    { id: 1, name: 'coffee', image: '☕', price: 2 },
    { id: 2, name: 'rose', image: '🌹', price: 5 },
    { id: 3, name: 'wine', image: '🍷', price: 10 },
    { id: 4, name: 'heart', image: '💖', price: 20 },
    { id: 5, name: 'teddyBear', image: '🧸', price: 30 },
    { id: 6, name: 'perfume', image: '🍾', price: 40 },
    { id: 7, name: 'star', image: '🌟', price: 50 },
    { id: 8, name: 'chocolates', image: '🍫', price: 60 },
    { id: 9, name: 'fireworks', image: '🎆', price: 75 },
    { id: 10, name: 'rocket', image: '🚀', price: 100 },
    { id: 11, name: 'diamond', image: '💎', price: 150 },
    { id: 12, name: 'ring', image: '💍', price: 200 }
  ];

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();
  //audioSrc: string = 'assets/audio/money.mp3';

  private fb = inject(FormBuilder);
  private moneyService = inject(MoneyService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  public dialogService = inject(DialogService);
  private transactionCreditService = inject(TransactionCreditService);
  public tipService = inject(TipService);
  private spinnerService = inject(SpinnerService);
  public router = inject(Router);
  public userCreditService = inject(UserCreditService);
  private socketService = inject(SocketService);

  constructor() {
    effect(() => {
      this.tip = this.tipService.tip();
    });
  }

  ngOnInit(): void {
    this.createFormControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async userCreditFinOne() {
    try {
      this.userCredit = await this.userCreditService.credit;
    } catch (error) {
      console.error(error);
    }
  }

  createFormControls() {
    this.myform = this.fb.group({
      amount: [5, [Validators.required, NumericValidatorTip]],
      message: ['', [Validators.nullValidator]]
    });
  }

  findOneMoney() {
    const data = {
      iso: 'USD'
    }
    this.moneyService.findOneIso(data).subscribe(res => {
      if (res) {
        this.money = res;
      }
    })
  }

  closeModal() {
    this.dialogService.closeModal();
  }

  selectGift(gift: Gift): void {
    // this.selectedGift = gift;
    const price = Number(gift.price);
    this.selectedGift = null;
    this.onSubmit(price);
  }

  sendGift() {
    if (this.selectedGift) {
      const price = Number(this.selectedGift.price);
      this.selectedGift = null;
      this.onSubmit(price);
    }
  }

  async onSubmit(price: number) {
    try {
      this.dialogService.closeModal();
      if (this.authService.user()) {
        // create user credit
        if (!this.userCreditService.userCredit()) {
          const data = {
            User: this.authService.user()!._id
          }
          this.userCreditService.create(data).subscribe(res => {
            if (res) {
              this.dialogService.toggleModal('creditPurchase');
              this.spinnerService.close();
            }
          });
          return;
        }

        if (Number(price) <= Number(this.userCreditService.userCredit()!.current)) {

          this.spinnerService.start();

          let data;

          const commonData = {
            type: this.tip.type,
            creditAmount: Number(price),
            Receiver: this.tip.user!._id,
          };

          if (this.tip.type === 'TIP_ACCOUNT' || this.tip.type === 'TIP_CAM' || this.tip.type === 'TIP_CHAT' || this.tip.type === 'TIP_LIVE') {
            data = {
              ...commonData,
            };
          } else if (this.tip.type === 'TIP_POST') {
            data = {
              ...commonData,
              Post: this.tip.post._id
            };
          }

          if (!data) {
            this.spinnerService.close();
            this.myform.patchValue({
              amount: Number(1),
            });
            return;
          }
          this.transactionCreditService.createTransfer(data)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res) => {
                if (res) {

                  if (this.tip.type === 'TIP_LIVE') {
                    const sendData = {
                      roomID: this.tip.roomID
                    };
                    this.socketService.socket.emit('live-tip-client', sendData);
                  } else {
                    this.playSound();
                  }

                  this.toastService.start({ type: 'success', message: 'tipWasSent' });
                  this.myform.patchValue({
                    amount: Number(5),
                  });
                }
              },
              error: (err) => {
                this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
                this.spinnerService.close();
              },
              complete: () => {
                this.dialogService.closeModal();
                this.spinnerService.close();
                console.log('Request completed');
              }
            });

        } else {
          //buy credit
          this.viewContainerRef.clear();
          this.viewContainerRef.createComponent(CreditPurchaseComponent);
          this.dialogService.toggleModal('creditPurchase');
        }
      } else {
        this.viewContainerRef.clear();
        this.viewContainerRef.createComponent(CreditPurchaseComponent);
        this.dialogService.toggleModal('creditPurchase');
      }
    } catch (error) {
      console.error(error);
    }
  }

  playSound() {
    const audio = new Audio('public/sounds/scale.mp3');
    audio.play();
  }

  //  input class
  inputClass(formGroup: FormGroup, controlName: string,) {
    return Tools.inputClass(formGroup, controlName);
  }
}
