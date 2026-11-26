import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NumeriDiscount, priceCreditDownload, pricePrimary } from '@core/common/custom-validators.ts';
import { UIStyles } from '@core/common/uistyles';
import { IconDirective } from '@directive/coin-svg.directive';
import { Membership } from '@interfaces/membership';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { NumberMoneyPipe } from '@pipes/number-money.pipe';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { MembershipService } from '@services/membership.service';
import { ProductCreditService } from '@services/product-credit.service';
import { SpinnerService } from '@services/spinner.service';
import { ToastService } from '@services/toast.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { UserService } from '@services/user.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-membership-setting',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    IconDirective,
    NumberMoneyPipe
  ],

  templateUrl: './membership-setting.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './membership-setting.component.scss'
})
export default class MembershipSettingComponent {

  loading = signal(false);

  myFormCreatorSubscription: FormGroup;
  myFormDownload: FormGroup;
  myFormRentalGirlfriend: FormGroup;
  myFormVideocall: FormGroup;

  totalPrice = signal<number>(0);
  priceCoinUnity = signal<number>(0);
  creatorUtilityAmount = signal<number>(0);

  membershipId = signal<string>('');

  memberships = signal<Membership[]>([]);
  rentalGirlfriends = signal<Membership[]>([]);
  videocall = signal<Membership[]>([]);
  downloadContents = signal<Membership[]>([]);

  subscriptionDays = [
    { id: 30, label: '1 daily' },
    { id: 60, label: '3 daily' },
    { id: 90, label: '6 daily' },
  ];

  rentalGirlfriendDays = [
    { id: 1, label: '1 day' },
    { id: 3, label: '3 days' },
    { id: 7, label: '7 days' },
  ];

  private destroy$ = new Subject<void>();

  private authService = inject(AuthService);
  private userService = inject(UserService);
  public membershipService = inject(MembershipService);
  public dialogService = inject(DialogService);
  public productCreditService = inject(ProductCreditService);
  public transactionCreditService = inject(TransactionCreditService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);

  ngOnInit(): void {
    this.createFormControls();
    this.creatorUtilityAmount.set(this.transactionCreditService.creditCalculator()?.utility?.creatorUtilityAmount || 0);
    this.findAllUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {

    this.myFormCreatorSubscription = new FormGroup({
      credit: new FormControl(10, [Validators.required, pricePrimary]),
      quantyTime: new FormControl(30, Validators.required),
      discount: new FormControl(0, [Validators.required, NumeriDiscount]),
    });

    this.myFormDownload = new FormGroup({
      credit: new FormControl(0, [Validators.required, priceCreditDownload]),
    });

    this.myFormRentalGirlfriend = new FormGroup({
      credit: new FormControl(10, [Validators.required, pricePrimary]),
      quantyTime: new FormControl(1, Validators.required),
      discount: new FormControl(0, [Validators.required, NumeriDiscount]),
    });

    this.myFormVideocall = new FormGroup({
      credit: new FormControl(10, [Validators.required, pricePrimary]),
      quantyTime: new FormControl(30, Validators.required),
      discount: new FormControl(0, [Validators.required, NumeriDiscount]),
    });
  }

  priceCreditSubscription(value: number, discount: number = 0) {

    if (value < 10) return 0;

    const quantityCoin = Number(value - discount);
    const priceCoin = Number(this.creatorUtilityAmount());
    const priceTotal = Number(quantityCoin * priceCoin);
    return Number(priceTotal);
  }

  priceCreditDownload(value: number) {

    if (value < 5) return 0;

    const quantityCoin = Number(value);
    const priceCoin = Number(this.creatorUtilityAmount());
    const priceTotal = Number(quantityCoin * priceCoin);
    return Number(priceTotal);
  }

  //  find all
  findAllUser(): void {

    this.loading.set(true);

    this.membershipService.resetMemberships();
    if (this.authService.user()) {
      this.membershipService.findAllUser(this.authService.user()?._id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            const { memberships, downloadContent, rentalGirlfriend, videocall } = res;

            if (memberships && memberships!.length > 0) {
              this.memberships.set(memberships);
            }

            if (downloadContent && downloadContent!.length > 0) {
              this.downloadContents.set(downloadContent!);
              this.myFormDownload.patchValue({
                credit: Number(downloadContent![0].credit) ?? 0
              });
            }

            if (rentalGirlfriend && rentalGirlfriend!.length > 0) {
              this.rentalGirlfriends.set(rentalGirlfriend!);
            }

            if (videocall && videocall!.length > 0) {
              this.videocall.set(videocall!);
            }

          },
          error: (err) => {
            this.loading.set(false);
            this.spinnerService.close();
          },
          complete: () => {
            this.loading.set(false);
            this.spinnerService.close();
          }
        })
    }
  }

  updateList(data: any): void {
    const { memberships, downloadContent, rentalGirlfriend, videocall } = data;

    this.memberships.set([]);
    this.downloadContents.set([]);
    this.rentalGirlfriends.set([]);
    this.videocall.set([]);

    if (memberships && memberships!.length > 0) {
      this.memberships.set(memberships);
    }

    if (downloadContent && downloadContent!.length > 0) {
      this.downloadContents.set(downloadContent!);
      this.myFormDownload.patchValue({
        credit: Number(downloadContent![0].credit) ?? 0
      });
    }

    if (rentalGirlfriend && rentalGirlfriend!.length > 0) {
      this.rentalGirlfriends.set(rentalGirlfriend!);
    }

    if (videocall && videocall!.length > 0) {
      this.videocall.set(videocall!);
    }
  }

  // subscription
  onSubmitSubscription() {
    this.dialogService.closeModal();

    if (!this.myFormCreatorSubscription.valid) {
      this.toastService.start({ type: 'error', message: 'formInvalid' });
      return;
    }

    const { quantyTime, credit, discount } = this.myFormCreatorSubscription.getRawValue();

    const data = {
      quantyTime: Number(quantyTime),
      credit: Number(credit),
      discount: Number(discount),
      category: 'CREATOR_SUBSCRIBE'
    };

    this.onCreate(data);
  }

  onFormSubscription(): void {
    this.dialogService.toggleModal('formSubscription');

    this.myFormCreatorSubscription.get('quantyTime')?.disable();
    this.myFormCreatorSubscription.get('credit')?.enable();

    this.myFormCreatorSubscription.patchValue({
      credit: 10,
      quantyTime: 30,
      discount: 0
    });
  }

  onEditSubscription(item: Membership): void {

    this.dialogService.toggleModal('formSubscription');
    this.myFormCreatorSubscription.patchValue({
      credit: item.creditReal,
      quantyTime: item.quantyTime,
      discount: Number(item.discount) ?? 0
    });

    this.myFormCreatorSubscription.get('quantyTime')?.disable();

    if (item.quantyTime !== 30) {
      this.myFormCreatorSubscription.get('credit')?.disable();
    } else {
      this.myFormCreatorSubscription.get('credit')?.enable();
    }
  }

  // download content
  onSubmitDownload(): void {
    if (!this.myFormDownload.valid) {
      this.toastService.start({ type: 'error', message: 'error' });
      return;
    }

    const { credit } = this.myFormDownload.getRawValue();

    const data = {
      quantyTime: 1,
      credit: Number(credit),
      discount: 0,
      category: 'DOWNLOAD_CONTENT'
    };

    this.myFormDownload.disable();
    this.onCreate(data);
  }

  // rental girlfriend
  onSubmitRentalGirlfriend(): void {

    this.dialogService.closeModal();

    if (!this.myFormRentalGirlfriend.valid) {
      this.toastService.start({ type: 'error', message: 'error' });
      return;
    }

    const { credit } = this.myFormRentalGirlfriend.getRawValue();

    const data = {
      quantyTime: 1,
      credit: Number(credit),
      discount: 0,
      category: 'RENTAL_GIRLFRIEND'
    };

    this.myFormRentalGirlfriend.disable();

    this.onCreate(data);
  }

  onFormRentalGirlfriend(): void {
    this.dialogService.toggleModal('formRentalGirlfriend');

    this.myFormRentalGirlfriend.get('quantyTime')?.disable();
    this.myFormRentalGirlfriend.get('credit')?.enable();

    this.myFormRentalGirlfriend.patchValue({
      credit: 10,
      quantyTime: 1,
      discount: 0
    });
  }

  onEditRentalGirlfriend(item: Membership): void {

    this.dialogService.toggleModal('formRentalGirlfriend');
    this.myFormRentalGirlfriend.patchValue({
      credit: item.creditReal,
      quantyTime: item.quantyTime,
      discount: Number(item.discount) ?? 0
    });

    this.myFormRentalGirlfriend.get('quantyTime')?.disable();

    if (item.quantyTime !== 1) {
      this.myFormRentalGirlfriend.get('credit')?.disable();
    } else {
      this.myFormRentalGirlfriend.get('credit')?.enable();
    }
  }

  // create 
  onCreate(data: any): void {
    console.log(data)
    this.spinnerService.start();
    this.membershipService.create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.updateList(res);
        },
        error: (err) => {
          this.spinnerService.close();
        },
        complete: () => {
          this.spinnerService.close();
        }
      });
  }

  // delete
  onDeleteModal(item: Membership): void {
    this.dialogService.closeModal();
    this.dialogService.toggleModal('deleteMembership');
    this.membershipId.set(item._id!);
  }

  onDelete(event: Event): void {
    event.preventDefault();

    this.dialogService.closeModal();
    this.spinnerService.start();
    this.membershipService.delete(this.membershipId())
      .subscribe({
        next: (res) => {
          this.updateList(res);
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'deletedSuccessfully' });
        }
      });

  }

  onTypeChange(event: any): void {
    const selectedValue = Number(event.target.value);

    const membership = this.membershipService.memberships().find(res => res.quantyTime === selectedValue)!;

    if (membership) {
      this.myFormCreatorSubscription.patchValue({
        credit: Number(membership!.credit) ?? 0,
        discount: Number(membership!.discount) ?? 0
      });
    } else {
      const membership = this.membershipService.memberships().find(res => res.quantyTime === 1)!;

      if (membership) {
        this.myFormCreatorSubscription.patchValue({
          credit: Number(membership!.credit! * selectedValue) ?? 0,
          quantyTime: selectedValue,
          discount: 0
        });
      }
    }

    if (selectedValue !== 1) {
      this.myFormCreatorSubscription.get('credit')?.disable();
    } else {
      this.myFormCreatorSubscription.get('credit')?.enable();
    }

  }

  // input class
  inputClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  buttonClass() {
    return UIStyles.buttonClass();
  }

  buttonPrimaryClass() {
    return UIStyles.buttonPrimaryClass();
  }

  buttonSecondaryClass() {
    return UIStyles.buttonSecondaryClass();
  }

  cardModalClass() {
    return UIStyles.cardModalClass();
  }

  modalClass() {
    return UIStyles.modalClass();
  }

  cardClass() {
    return UIStyles.cardClass();
  }
}
