import { Component, ComponentRef, computed, effect, EventEmitter, inject, Output, signal, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { TipService } from '../../services/tip.service';
import { SpinnerService } from '../../services/spinner.service';
import { Router } from '@angular/router';
import { TransactionCreditService } from '../../services/transaction-credit.service';
import { NumericValidatorTip } from '../../core/common/custom-validators.ts';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { DialogService } from '@services/dialog.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Money } from '@interfaces/money';
import { UIStyles } from '@core/common/uistyles';
import { Subject, takeUntil } from 'rxjs';
import { SubscriptionService } from '@services/subscription.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { User } from '@interfaces/user';
import { environment } from '@environments/environment';
import { KissService } from '@services/kiss.service';
import { ToolsService } from '@services/tools.service';
import { SoundService } from '@services/sound.service';
import { UserCredit } from '@interfaces/transactionCredit';
import { Tip } from '@interfaces/tip';
import { LovenseSessionService } from '@services/lovense-session.service';
import { Membership } from '@interfaces/membership';
import { LovenseProduct } from '@interfaces/lovenseProduct';
import { MembershipService } from '@services/membership.service';
import { UserService } from '@services/user.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

interface Gift {
  id: number;
  name: string;
  image: string;
  price: number;
}

@Component({
  selector: 'app-tip',
  imports: [
    NgOptimizedImage,
    CommonModule,
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    IconDirective
  ],
  providers: [],
  templateUrl: './tip.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './tip.component.scss'
})
export class TipComponent {
  public className = UIStyles;
  loading: boolean = false;
  myform: FormGroup;
  money: Money;
  tip: Tip;
  lovenseControl = signal<Membership[]>([]);
  chatId = signal(null);

  selectedGift: Gift | null = null;

  gifts: Gift[] = [
    { id: 1, name: 'rose', image: '🌹', price: 1 },
    { id: 2, name: 'coffee', image: '☕', price: 5 },
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

  activeTab: 'gifts' | 'toys' = 'gifts';

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();
  @Output() closeModal = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  public dialogService = inject(DialogService);
  public transactionCreditService = inject(TransactionCreditService);
  public tipService = inject(TipService);
  private spinnerService = inject(SpinnerService);
  public router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private kissService = inject(KissService);
  private toolsService = inject(ToolsService);
  private soundService = inject(SoundService);
  public lovenseSessionService = inject(LovenseSessionService);
  public membershipService = inject(MembershipService);
  public userService = inject(UserService);

  constructor() {
    effect(() => {
      this.tip = this.tipService.tip()!;
      this.lovenseControl.set(this.membershipService.memberships());
    });
  }

  ngOnInit(): void {
    this.createFormControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {
    this.myform = this.fb.group({
      amount: [5, [Validators.required, NumericValidatorTip]],
      message: ['', [Validators.nullValidator]]
    });
  }

  getProfileImageUrl(user: User): string {
    const userProfile = user;
    if (!userProfile || !userProfile.Profile || userProfile.Profile.length === 0) {
      return '';
    }

    const profile = userProfile.Profile[0];

    if (profile.cloudflare && profile.cloudflare.result && profile.cloudflare.result.variants && profile.cloudflare.result.variants.length > 0) {
      return profile.cloudflare.result.variants[0];
    }

    return profile.url || '';
  }

  logout() {
    this.dialogService.closeModal();
    this.subscriptionService.resetSubscribersUserJoin();
    this.authService.logout();
  }

  // close
  onCloseModal() {
    this.closeModal.emit(); // Notifica al padre que el modal se cerró
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

      this.onCloseModal();
      if (this.authService.user()) {

        if (Number(price) <= Number(this.userService.userCurrent()?.UserCredit?.current)) {

          this.spinnerService.start();

          let data: any = {
            type: 'TIP',
            typeContent: this.tip?.typeContent || 'NONE',
            creditAmount: Number(price),
            ReceiverId: this.tip.user?._id,
          };

          if (!data) {
            this.spinnerService.close();
            this.myform.patchValue({
              amount: Number(1),
            });
            return;
          }

          this.myform.patchValue({
            amount: Number(5),
          });

          this.transactionCreditService.createTransfer(data)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res) => {
                if (res?.TransactionCredit) {
                  //sound
                  if (this.tip?.typeContent !== 'LIVE') {
                    this.soundService.playSoundTip();
                  }
                  this.toastService.start({ type: 'success', message: 'tipWasSent' });
                  this.kissService.start(2500);
                } else {
                  this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
                }
              },
              error: (err) => {
                this.spinnerService.close();
              },
              complete: () => {
                this.spinnerService.close();
              }
            });

        } else {
          //buy credit
          this.openCreditPurchase();
        }
      } else {
        this.openCreditPurchase();
      }
    } catch (error) {

    }
  }

  // lovense
  onActivate(item: Membership) {
    const { quantyTime, lovenseConfig } = item;
    this.onCloseModal();
    if (this.authService.user()) {

      if (Number(item.credit) <= Number(this.userService.userCurrent()?.UserCredit?.current)) {

        this.spinnerService.start();

        const data = {
          UserId: item.User,
          level: lovenseConfig?.vibration || '',
          timeSec: quantyTime,
          toyId: item.lovenseConfig?.LovenseProduct.code,
          transactionCredit: {
            Site: environment.site,
            creditAmount: Number(item.credit),
            type: 'TIP',
            ReceiverId: item.User!.toString(),
          }
        }

        this.lovenseSessionService.sendCommandCloud(data).subscribe({
          next: (res) => {
            if (!res.result) {
              this.toastService.start({ type: 'error', message: 'error.somethingWentWrong' });
            }
            this.kissService.start(2500);
          },
          error: (err) => {
            this.spinnerService.close();
          },
          complete: () => {
            this.spinnerService.close();
          }
        });
      } else {
        //buy credit
        this.openCreditPurchase();
      }
    } else {
      //buy credit
      this.openCreditPurchase();
    }
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

  // 
  openCreditPurchase(): void {
    this.closeModal.emit();
    this.dialogService.toggleModal('creditPurchase');
  }

  getFirstLetter(name: string): string {
    return this.toolsService.getFirstLetter(name);
  }

}
