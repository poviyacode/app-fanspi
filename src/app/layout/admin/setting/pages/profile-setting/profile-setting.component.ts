import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, AfterViewInit, inject, effect, signal, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  MinValidator,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import {
  AgeValidator,
  NumericValidator,
  fileTypeValidator,
  urlValidator,
  usernameValidator,
  fileTypeImageValidator,
} from '@core/common/custom-validators.ts';
import { UIStyles } from '@core/common/uistyles';
import { environment } from '@environments/environment';
import { PostMediaDetails } from '@interfaces/postMedia';
import { SocialMedia } from '@interfaces/socialMedia';
import { User } from '@interfaces/user';
import { SpinnerService } from '@services/spinner.service';
import { ToastService } from '@services/toast.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { CloudflareService } from '@services/cloudflare.service';
import { CountryService } from '@services/country.service';
import { PostMediaService } from '@services/post-media.service';
import { SocialMediaService } from '@services/social-media.service';
import { TagService } from '@services/tag.service';
import { UserService } from '@services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { Country } from '@interfaces/country';
import { IconDirective } from '@directive/coin-svg.directive';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import { CalculateAgePipe } from '@pipes/calculate-age.pipe';
import { DialogService } from '@services/dialog.service';
import { AutoResizeTextareaDirective } from '@directive/auto-resize-textarea.directive';
import { DragDropModule, moveItemInArray, CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { GigService } from '@services/gig.service';
import { TransactionCreditService } from '@services/transaction-credit.service';

@Component({
  selector: 'app-profile-setting',
  imports: [
    NgOptimizedImage,
    CommonModule,
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    IconDirective,
    DateAgoPipe,
    CalculateAgePipe,
    AutoResizeTextareaDirective,
    DragDropModule
  ],
  templateUrl: './profile-setting.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./profile-setting.component.scss']
})
export default class ProfileSettingComponent {
  loading: boolean;
  videoCoverUrl: any;
  videoProfileUrl: any;

  myformCover: FormGroup;
  myformProfile: FormGroup;
  myformInfo: FormGroup;
  // rental girfriend
  myFormRentalGirlfriend: FormGroup;

  isProfile = signal<boolean>(false);
  countriesPhone = signal<Country[] | null>(null);

  isProfitVisible: boolean = true;

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  maxSizeInMB = environment.maxSizeInMB;

  private destroy$ = new Subject<void>();

  socialMediaArray: any[] = [];

  genderArray: any[] = [
    { value: 'MAN', name: 'man' }, { value: 'WOMAN', name: 'woman' },
  ];

  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private spinnerService = inject(SpinnerService);
  private toastService = inject(ToastService);
  private postMediaService = inject(PostMediaService);
  private cloudflareService = inject(CloudflareService);
  private userService = inject(UserService);
  private countryService = inject(CountryService);
  private socialMediaService = inject(SocialMediaService);
  private tagService = inject(TagService);
  public authService = inject(AuthService);
  public dialogService = inject(DialogService);
  private titleService = inject(Title);
  private gigService = inject(GigService);
  public transactionCreditService = inject(TransactionCreditService);

  constructor() {
    this.titleService.setTitle('Profile Setting');
    if (this.authService.user()?.Profile?.length! > 0) {
      this.isProfile.set(true);
    }
  }

  ngOnInit(): void {

    this.socialMediaArray = this.socialMediaService.getConfig();

    const userMedia = this.authService.user()?.SocialMedia || [];
    this.socialMediaItems.set([...userMedia]);

    if (this.authService.user()) {
      this.createFormPersonalizationControls();
      this.createFormInfoControls();
      this.createFormSocialMediaControls();
      this.createFormTagControls();
      this.createFormRentalGirlfriendControls();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    //reset
    this.countriesPhone.set(null);
  }

  // find
  findAllPhone() {
    this.countryService.findAllPhone().subscribe((res) => {
      if (res) {
        this.countriesPhone.set(res);
        this.myformSocialMedia.patchValue({
          //Country: data.Country,
        });
      } else {
        this.countriesPhone.set(null);
      }
    });
  }

  imageProfile(): string | undefined {
    const user = this.authService.user();

    if (!user || !user.Profile || user.Profile.length === 0) {
      return undefined;
    }

    const profile = user.Profile[0];
    if (profile.cloudflare && profile.cloudflare.result && profile.cloudflare.result.variants && profile.cloudflare.result.variants.length > 0) {
      return profile.cloudflare.result.variants[0];
    }

    return profile.url;
  }

  // personalization
  imagesCover: any[] = [];
  selectedFilesCover: any[] = [];
  imagesProfile: any[] = [];
  selectedFilesProfile: any[] = [];
  uploadingCover = signal(false);
  uploadingProfile = signal(false);

  createFormPersonalizationControls() {
    this.myformCover = this.fb.group({
      file: ['', Validators.required, fileTypeValidator],
    });
    this.myformProfile = this.fb.group({
      file: ['', Validators.required, fileTypeImageValidator],
    });
  }

  //cover
  onFileCoverChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      const maxSizeInMB = this.maxSizeInMB;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      var i = 0;
      for (let file of event.target.files) {
        if (file.size >= maxSizeInBytes) {
          this.toastService.start({ type: 'error', message: `fileTooLarge` });
          return;
        }

        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[i]);
        const mimetype = event.target.files[i].type.split('/')[1];
        let myNewFile: any = new File(
          [event.target.files[i]],
          `${name}.${mimetype}`,
          { type: event.target.files[i].type }
        );
        reader.onload = (e: any) => {
          this.imagesCover.push({
            _id: '' + Date.now(),
            file: myNewFile,
            url: e.target.result,
            typeFile: file.type.split('/'),
          });
          this.uploadingCover.set(true);
        };
        i++;
      }
      event.target.value = '';
    }
  }

  deleteImageCover(file: any) {
    this.imagesCover.splice(this.imagesCover.indexOf(file), 1);
    if (this.imagesCover.length == 0) {
      this.myformCover.patchValue({
        file: null,
      });
    }

    this.uploadingCover.set(false);
  }

  async onSubmitCover() {
    if (this.myformCover.valid) {

      const dataArray = await this.uploadFiles('COVER');

      this.spinnerService.start();

      const data = {
        Site: this.authService.user()!.Site?._id,
        filesArray: dataArray,
        category: 'COVER',
      };
      await this.onSubmit(data);
    }
  }

  //profile
  onFileProfileChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      const maxSizeInMB = this.maxSizeInMB;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      var i = 0;
      for (let file of event.target.files) {
        if (file.size >= maxSizeInBytes) {
          this.toastService.start({ type: 'error', message: `fileTooLarge` });
          return;
        }
        var reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagesProfile.push({
            _id: '' + Date.now(),
            file: file,
            url: e.target.result,
            typeFile: file.type.split('/'),
          });

          this.uploadingProfile.set(true);
        };
        reader.readAsDataURL(event.target.files[i]);
        i++;
      }
      event.target.value = '';
    }
  }

  deleteImageProfile(file: any) {
    this.imagesProfile.splice(this.imagesProfile.indexOf(file), 1);
    if (this.imagesProfile.length == 0) {
      this.myformProfile.patchValue({
        file: null,
      });
    }
    this.uploadingProfile.set(false);
  }

  async onSubmitProfile() {

    if (this.myformProfile.valid) {

      const dataArray = await this.uploadFiles('PROFILE');

      this.spinnerService.start();

      const data = {
        Site: this.authService.user()!.Site?._id,
        filesArray: dataArray,
        category: 'PROFILE',
      };
      await this.onSubmit(data);
    }
  }

  async onSubmit(data: any) {
    this.userService
      .profile(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            if (data.category == 'COVER') {
              const updatedUser: User = {
                ...this.authService.user(),
                Cover: res.Cover,
              };
              this.authService.addUser(updatedUser);
              this.imagesCover = [];
              this.selectedFilesCover = this.authService.user()!.Cover!;
              this.myformCover.patchValue({
                file: null,
              });
              this.uploadingCover.set(false);
            } else if (data.category == 'PROFILE') {
              const updatedUser: User = {
                ...this.authService.user(),
                Profile: res.Profile,
              };
              this.authService.addUser(updatedUser);
              this.imagesProfile = [];
              this.selectedFilesProfile = this.authService.user()!.Profile!;
              this.myformProfile.patchValue({
                file: null,
              });
              this.uploadingProfile.set(false);
            }
            this.spinnerService.close();
            this.toastService.start({ type: 'success', message: 'completedSuccessfully', });
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain', });
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'completedSuccessfully', });
        },
      });
  }

  // upload file
  async uploadFiles(category: 'COVER' | 'PROFILE' | string) {
    this.spinnerService.start();

    try {
      // 1. Determinar la fuente de datos dinámicamente
      const sources: Record<string, any[]> = {
        'COVER': this.imagesCover,
        'PROFILE': this.imagesProfile
      };

      const selectedFiles = sources[category];

      // Si no hay archivos o la categoría no es válida, salimos temprano
      if (!selectedFiles || selectedFiles.length === 0) {
        return [];
      }

      // 2. Mapeamos a promesas de subida (Lógica única para cualquier categoría)
      const uploadPromises = selectedFiles.map(async (item) => {
        const file = item.file;
        const [type, extension] = file.type.split('/');
        const additionalObject: any = { type, extension };

        // Subida según tipo de archivo
        if (type === 'video') {
          additionalObject.cloudflare = await this.cloudflareService.uploadToVideoCloudflare(file);
        } else if (type === 'image') {
          additionalObject.cloudflare = await this.cloudflareService.uploadToImageCloudflare(file);
        }

        return additionalObject;
      });

      // 3. Ejecutar en paralelo y retornar
      return await Promise.all(uploadPromises);

    } catch (error) {
      this.spinnerService.close();
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
      throw error;
    }
  }

  //info
  interestedInArray: any[] = [
    { value: 'MEN', name: 'men' },
    { value: 'WOMEN', name: 'women' },
    { value: 'ALL', name: 'all' },
  ];

  createFormInfoControls() {
    const age = this.calculateAge(this.authService.user()!.age || 18);

    this.myformInfo = this.fb.group({
      alias: new FormControl(
        this.authService.user()!.alias || null,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
        ],
      ),
      age: new FormControl(
        age,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(2),
          AgeValidator,
        ],
      ),
      gender: new FormControl(this.authService.user()?.gender || 'WOMAN', Validators.required),
      country: new FormControl(this.authService.user()?.Country?.code || 'US', Validators.required),
      bio: [this.authService.user()!.bio || null, Validators.required],

      interestedIn: new FormControl('ALL', Validators.required),
    });
  }

  onSubmitInfo(): void {
    if (this.myformInfo.valid) {

      const country = this.countriesPhone()?.find(item => item.code == this.myformInfo.value.country);

      this.spinnerService.start();
      this.onCloseModal();

      const data = {
        alias: this.myformInfo.value.alias,
        age: Number(this.myformInfo.value.age),
        gender: this.myformInfo.value.gender,
        Country: country?._id,
        bio: this.myformInfo.value.bio,
      };

      const userId = this.authService.user()?._id;
      this.userService
        .update(userId, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {
              const updatedUser: User = {
                ...this.authService.user(),
                alias: res.alias,
                age: res.age,
                gender: res.gender,
                Country: res.Country,
                bio: res.bio,
              };
              this.authService.addUser(updatedUser);
            }
          },
          error: (err) => {
            this.spinnerService.close();
            this.toastService.start({
              type: 'error',
              message: 'pleaseTryAgain',
            });
          },
          complete: () => {
            this.spinnerService.close();
            this.toastService.start({
              type: 'success',
              message: 'completedSuccessfully',
            });
          },
        });
    }
  }

  async onChangeEditInfo() {
    this.dialogService.toggleModal('info');
    if (!this.countriesPhone()) {
      this.findAllPhone();
    }
  }

  //edit social network
  countries = signal<Country[] | null>(null);
  myformSocialMedia: FormGroup;
  socialMediaId = signal<string | null>(null);
  socialMediaItems = signal<any[]>([]);

  createFormSocialMediaControls() {
    this.myformSocialMedia = this.fb.group({
      type: ['Onlyfans', Validators.required],
      phonePrefix: ['+1', Validators.required],
      phone: ['', [Validators.nullValidator, NumericValidator]], //[validatePhoneRequired.bind(this)]],
      username: ['', [Validators.nullValidator, usernameValidator(), Validators.minLength(3), Validators.maxLength(50)]],
      link: ['', [Validators.nullValidator, urlValidator()]],
      title: ['', [Validators.nullValidator, Validators.minLength(3), Validators.maxLength(50)]],
    });

    this.myformSocialMedia.get('type')!.valueChanges.subscribe((value: any) => {

      const usernameControl = this.myformSocialMedia.get('username');
      const phoneControl = this.myformSocialMedia.get('phone');
      const linkControl = this.myformSocialMedia.get('link'); // Asumiendo que existe

      // 1. Limpiamos validadores previos para evitar residuos
      usernameControl?.clearValidators();
      phoneControl?.clearValidators();
      linkControl?.clearValidators();

      if (value !== 'WhatsApp' && value !== 'website') {
        usernameControl?.setValidators([
          Validators.required,
          usernameValidator(),
          Validators.minLength(3),
          Validators.maxLength(20),
        ]);
        phoneControl?.setValidators([
          Validators.nullValidator
        ]);
      }
      else if (value === 'WhatsApp') {
        // WHATSAPP
        phoneControl?.setValidators([
          Validators.required,
          NumericValidator,
          Validators.minLength(6),
          Validators.maxLength(15) // <-- CORREGIDO: Era maxLength
        ]);
        usernameControl?.setValidators([
          Validators.nullValidator
        ]);
      }
      else if (value === 'website') {
        // WEBSITE 
        linkControl?.setValidators([
          Validators.required,
          urlValidator(),
          // Aquí podrías agregar un validador de URL si lo tienes
        ]);
        usernameControl?.setValidators([
          Validators.nullValidator
        ]);
        phoneControl?.setValidators([
          Validators.nullValidator
        ]);
      }

      usernameControl?.updateValueAndValidity();
      phoneControl?.updateValueAndValidity();
      linkControl?.updateValueAndValidity();

      const type = value;
      if (type) {
        this.generateLink(type);
      }
    });

    this.myformSocialMedia.get('username')!.valueChanges.subscribe((value: any) => {
      const formValues = this.myformSocialMedia.getRawValue();
      const type = formValues!.type;
      if (type) {
        this.generateLink(type);
      }
    });

    this.myformSocialMedia.get('phone')!.valueChanges.subscribe((value: any) => {
      const formValues = this.myformSocialMedia.getRawValue();
      const type = formValues!.type;
      if (type === 'WhatsApp') {
        this.generateLink(type);
      }
    });

    this.myformSocialMedia.get('phonePrefix')!.valueChanges.subscribe((value: any) => {
      const formValues = this.myformSocialMedia.getRawValue();
      const type = formValues!.type;
      if (type === 'WhatsApp') {
        this.generateLink(type);
      }
    });
  }

  generateLink(type: string) {
    const formValues = this.myformSocialMedia.getRawValue();

    let link = '';
    const socialMedia: any = this.socialMediaArray.find(
      (item) => item.type === type
    );

    let username = '';
    if (formValues!.username!) {
      const usernameString = formValues!.username!.toString();
      const x = `${usernameString}`.trim();
      username = this.extractUsernameFromUrl(usernameString.trim());
    }

    if (type !== 'website') {
      if (type === 'WhatsApp') {
        link = `${socialMedia.url}` +
          this.myformSocialMedia.get('phonePrefix')!.value + this.myformSocialMedia.get('phone')!.value + '/?text=' +
          this.textMessage().slice(0, 20);
      } else {
        link = `${socialMedia.url}${username}`;
      }
      this.myformSocialMedia.patchValue({
        link: link,
      });
    }

  }

  onAddButtonSocialMedia() {
    this.dialogService.toggleModal('socialMedia');
    if (!this.countriesPhone()) {
      this.findAllPhone();
    }

    this.myformSocialMedia.reset();

    this.myformSocialMedia.patchValue({
      type: 'Onlyfans',
      phonePrefix: '+1',
    });

    this.myformSocialMedia.get('type')?.enable();
  }

  onEditButtonSocialMedia(socialMedia: SocialMedia) {
    this.dialogService.toggleModal('socialMedia');
    if (!this.countriesPhone()) {
      this.findAllPhone();
    }

    this.socialMediaId.set(socialMedia._id!);

    this.myformSocialMedia.patchValue({
      type: socialMedia.type,
      phonePrefix: socialMedia.phonePrefix,
      phone: Number(socialMedia.phone),
      username: socialMedia.username,
      link: socialMedia.link,
      title: socialMedia.title,
    });

    this.myformSocialMedia.get('type')?.disable();
  }

  onSubmitSocialMedia($event: any): void {

    if (this.myformSocialMedia.invalid) return;

    const formValue = this.myformSocialMedia.value;
    const requiredFields: { [key: string]: string } = {
      WhatsApp: 'phone',
      website: 'link',
      default: 'username',
    };

    const fieldToValidate =
      requiredFields[formValue.type] || requiredFields['default'];

    if (formValue[fieldToValidate] === '') {
      return;
    }

    this.onCloseModal();
    this.spinnerService.start();
    const { type, phonePrefix, phone, username, link, title } = this.myformSocialMedia.getRawValue();
    const data = {
      type: type,
      phonePrefix: phonePrefix,
      phone: Number(phone),
      username: username,
      link: link,
      title: title,
    };
    if (this.socialMediaId()) {
      this.updateSocialMedia(this.socialMediaId()!, data);
    } else {
      this.createSocialMedia(data);
    }
  }

  createSocialMedia(data: any) {
    this.socialMediaService
      .create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {

            const user = this.authService.user()!;
            user.SocialMedia?.push(res);
            this.socialMediaItems().push(res);
            this.authService.updateUser({
              SocialMedia: user.SocialMedia
            });

            this.myformSocialMedia.patchValue({
              phonePrefix: '+1',
              phone: '',
              username: '',
              link: '',
            });
            this.toastService.start({
              type: 'success',
              message: 'completedSuccessfully',
            });
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.spinnerService.close();
        },
      });
  }

  updateSocialMedia(id: string, data: any) {

    this.socialMediaId.set(null);

    this.socialMediaService
      .update(id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {

            const user = this.authService.user()!;
            const socialMediaIndex = user.SocialMedia?.findIndex((s) => s._id === res._id);

            if (socialMediaIndex !== -1 && socialMediaIndex !== undefined) {
              user.SocialMedia![socialMediaIndex] = res;
            }

            this.authService.updateUser({
              SocialMedia: user.SocialMedia
            });
            this.socialMediaItems.update(items => {
              const index = items.findIndex((s) => s._id === res._id);
              if (index !== -1) {
                items[index] = res;
              }
              return items;
            });
            this.myformSocialMedia.patchValue({
              phonePrefix: '+1',
              phone: '',
              username: '',
              link: '',
            });
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
          this.spinnerService.close();
        },
      });
  }

  onEditSocialMedia(id: string, socialMedia: any) {
    this.dialogService.toggleModal('socialMedia');
    this.myformSocialMedia.patchValue({
      type: socialMedia.type,
      phonePrefix: socialMedia.phonePrefix,
      phone: Number(socialMedia.phone),
      username: socialMedia.username,
      link: socialMedia.link,
      title: socialMedia.title,
    });
  }

  onEditSocialMediaSubmit(id: string): void {

    if (this.myformSocialMedia.invalid) return;

    const formValue = this.myformSocialMedia.value;
    const requiredFields: { [key: string]: string } = {
      WhatsApp: 'phone',
      website: 'link',
      default: 'username',
    };

    const fieldToValidate = requiredFields[formValue.type] || requiredFields['default'];

    if (formValue[fieldToValidate] === '') {
      return;
    }

    this.onCloseModal();
    this.spinnerService.start();

    const data = {
      type: this.myformSocialMedia.value.type,
      phonePrefix: this.myformSocialMedia.value.phonePrefix,
      phone: Number(this.myformSocialMedia.value.phone),
      username: this.myformSocialMedia.value.username,
      link: this.myformSocialMedia.value.link,
      title: this.myformSocialMedia.value.title,
    };

    this.socialMediaService
      .update(id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            const user = this.authService.user()!;

            const existingSocialMediaIndex = user.SocialMedia?.findIndex(item => item._id === res._id);

            if (existingSocialMediaIndex !== -1 && existingSocialMediaIndex !== undefined) {
              user.SocialMedia![existingSocialMediaIndex] = res;
            }

            this.authService.updateUser({
              SocialMedia: user.SocialMedia
            });

            this.myformSocialMedia.reset({
              phonePrefix: '+1',
              phone: '',
              username: '',
              link: '',
            });

            this.toastService.start({
              type: 'success',
              message: 'completedSuccessfully',
            });
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.spinnerService.close();
        },
      });
  }

  onDeleteSocialMedia(id: string): void {
    const user = this.authService.user();
    const initialLength = user?.SocialMedia?.length;
    user!.SocialMedia = user?.SocialMedia!.filter(item => item._id !== id);
    if (user?.SocialMedia?.length! < initialLength!) {
      this.toastService.start({ type: 'success', message: 'completedSuccessfully', });
    } else {
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
    }
    this.spinnerService.start();
    this.socialMediaService
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.authService.updateUser({
              SocialMedia: user?.SocialMedia
            });
            this.socialMediaItems.update(items => {
              return items.filter(item => item._id !== id);
            });
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
        },
      });
  }

  dropSocialMedia(event: CdkDragDrop<any[]>): void {
    // 1. Validación de seguridad
    if (!event.container.data) {
      return;
    }

    // 2. Mover visualmente en el contenedor (UI inmediata)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    // 3. Copia inmutable del estado global del usuario
    const list = [...(this.authService.user()?.SocialMedia || [])];

    // 4. Aplicar el mismo movimiento a la copia global
    moveItemInArray(list, event.previousIndex, event.currentIndex);

    // 5. Actualizar la propiedad 'order' en cada objeto (índice = nuevo orden)
    list.forEach((item: any, index: number) => {
      item.order = index;
    });

    // 6. Payload limpio para el backend (solo _id y order)
    const payloadOrders = list.map((item: any) => ({
      _id: item._id,
      order: item.order
    }));
    this.spinnerService.start();
    // 7. Enviar al backend
    this.socialMediaService.reorderSocialMedia({ orders: payloadOrders })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {

          // ✅ ACTUALIZAR LA SEÑAL LOCAL DE LA UI
          //this.socialMediaItems.set(list);

          // ✅ SINCRONIZAR EL ESTADO GLOBAL EN authService
          this.updateAuthUserSocialMedia(res);

          this.toastService.start({
            type: 'success',
            message: 'completedSuccessfully'
          });
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({
            type: 'error', message: 'pleaseTryAgain'
          });
        }, complete: () => {
          this.spinnerService.close();
        }
      });
  }

  private updateAuthUserSocialMedia(updatedList: any[]) {
    const currentUser = this.authService.user();
    if (!currentUser) return;

    // 🔹 OPCIÓN A: Si authService tiene un método updateUser/patchUser (Recomendado)
    if (typeof this.authService.updateUser === 'function') {
      this.authService.updateUser({ SocialMedia: updatedList });
      return;
    }

    // 🔹 OPCIÓN B: Si 'user' es un WritableSignal (Angular 16+)
    // this.authService.user.update(u => ({
    //   ...u,
    //   SocialMedia: updatedList
    // }));

    // 🔹 OPCIÓN C: Si usa BehaviorSubject (RxJS)
    // const current = this.authService.user$.getValue();
    // this.authService.user$.next({ ...current, SocialMedia: updatedList });
  }

  getModifiedIconPath(type: string): string {
    return this.socialMediaService.getIconPath(type);
  }

  textMessage() {
    return `Hello, I just saw your page on ${environment.domain}`;
  }

  //edit tags
  myformTag: FormGroup;

  createFormTagControls() {
    this.myformTag = this.fb.group({
      tag: ['', [Validators.required, Validators.maxLength(20)]],
    });
  }

  onSubmitTag($event: any): void {
    if (this.myformTag.valid) {

      const tag = this.generateTag(this.myformTag.value.tag);
      const data = {
        name: this.myformTag.value.tag,
        tag: tag.toLowerCase(),
      };

      this.onCloseModal();
      this.spinnerService.start();

      this.tagService
        .create(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {

              const user = this.authService.user()!;
              user.Tag?.push(res);
              this.authService.updateUser({
                Tag: user.Tag
              });

              this.myformTag.patchValue({
                tag: '',
              });

              this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
            }
          },
          error: (err) => {
            this.spinnerService.close();
            if (
              err.error.message ===
              `Tag "${this.myformTag.value.tag}" already exists`
            ) {
              this.toastService.start({
                type: 'error',
                message: 'alreadyExists',
              });
            } else {
              this.toastService.start({
                type: 'error',
                message: 'pleaseTryAgain',
              });
            }
          },
          complete: () => {
            this.spinnerService.close();
          },
        });
    }
  }

  generateTag(text: string): string {
    const cleanedText = text.replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{1F004}\u{1F0CF}\u{2B06}\u{2194}-\u{21AA}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25FE}\u{25FB}\u{2B06}\u{2194}-\u{21AA}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25FE}\u{25FB}\u{2B06}\u{2194}-\u{21AA}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25FE}\u{25FB}\u{2B06}\u{2194}-\u{21AA}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25FE}\u{25FB}]/gu,
      ''
    );
    return cleanedText.replace(/\s+/g, '');
  }

  onAddButtonTag() {
    this.dialogService.toggleModal('tag');
  }

  onDeleteTag(id: string): void {

    const user = this.authService.user();
    const initialLength = user?.Tag?.length;
    user!.Tag = user?.Tag!.filter(item => item._id !== id);
    if (user?.Tag?.length! < initialLength!) {
      this.toastService.start({ type: 'success', message: 'completedSuccessfully', });
    } else {
      this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
    }

    this.tagService
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.authService.updateUser({
              Tag: user!.Tag
            });
          }
        },
        error: (error) => {
          if (error === 'This tag already exists') {
            this.toastService.start({
              type: 'error',
              message: 'alreadyExists',
            });
          } else {
            this.toastService.start({
              type: 'error',
              message: 'pleaseTryAgain',
            });
          }
        },
        complete: () => {

        },
      });
  }

  //  rental Girlfriend
  currentVirtualGig = signal<any>(null);
  minDateTime!: string;

  createFormRentalGirlfriendControls() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Guardamos la fecha mínima actual como propiedad si la necesitas en el HTML
    this.minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    this.myFormRentalGirlfriend = new FormGroup({
      title: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+$/)]),
      description: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      category: new FormControl('RENTAL_GIRLFRIEND', Validators.required),
      availableAt: new FormControl(this.minDateTime, [Validators.required, this.futureDateValidator()])
    });
  }

  futureDateValidator() {
    return (control: AbstractControl) => {
      if (!control.value) {
        return null;
      }
      const selectedDate = new Date(control.value);
      const currentDate = new Date();

      // Si la fecha seleccionada es menor o igual a la actual, retorna un error
      if (selectedDate <= currentDate) {
        return { pastDate: true };
      }
      return null;
    };
  }

  onAddButtonRentalGirlFriend() {
    this.dialogService.toggleModal('girlFriend');
  }

  onEditRentalGirlFriend(gig: any) {

  }

  onSubmitRentalGirlFriend(event: Event) {
    event.preventDefault();
    if (this.myFormRentalGirlfriend.valid) {
      const formData = this.myFormRentalGirlfriend.getRawValue();
      this.spinnerService.start();

      this.gigService.create(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {

              this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
              this.myFormRentalGirlfriend.reset();
            }
          },
          error: (error) => {
            this.spinnerService.close();
            this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
          },
          complete: () => {
            this.spinnerService.close();
          },
        });
    }
  }

  onDeleteVirtualGig(id: string) {

  }

  toggleProfitVisibility() {
    this.isProfitVisible = !this.isProfitVisible;
  }

  // 
  extractUsernameFromUrl(url: string): string {
    const regexPattern =
      /(?:https?:\/\/)?(?:www\.)?(?:whatsapp\.com|facebook\.com|twitter\.com|youtube\.com|t\.me|telegram\.org|onlyfans\.com|instagram\.com|tiktok\.com|amazon\.com|linkedin\.com|twitch\.tv|snapchat\.com|discord\.com|patreon\.com|pinterest\.com|likee\.video|etsy\.com)\/(?:.*\/)*([^/?#&]+).*$/;
    const matches = url.match(regexPattern);
    return matches && matches[1] ? matches[1] : url;
  }

  getIframeSrc(uid: string, thumbnail: string) {
    const url = `https://customer-6kruyx7h361tmu11.cloudflarestream.com/${uid}/iframe?autoplay=true&preload=true&loop=true&muted=true&poster=${thumbnail}`;
    const videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    return videoUrl;
  }

  generateLinkSocialMedia(
    formGroup: FormGroup,
    typeFieldName: string,
    linkFieldName: string,
    phonePrefixFieldName: string,
    phoneFieldName: string
  ): string {
    const type = formGroup.get(typeFieldName)!.value;
    if (type === 'WhatsApp') {
      const phonePrefix = formGroup.get(phonePrefixFieldName)!.value;
      const phone = formGroup.get(phoneFieldName)!.value;
      return `https://wa.me/${phonePrefix}${phone}/?text=${this.textMessage()}`;
    } else {
      return formGroup.get(linkFieldName)!.value;
    }
  }

  truncateLink(
    formGroup: FormGroup,
    typeFieldName: string,
    linkFieldName: string,
    phonePrefixFieldName: string,
    phoneFieldName: string
  ): string {
    const type = formGroup.get(typeFieldName)!.value;
    const link =
      type === 'WhatsApp'
        ? `https://wa.me/${formGroup.get(phonePrefixFieldName)!.value}${formGroup.get(phoneFieldName)!.value
        }/?text=${this.textMessage()}`
        : formGroup.get(linkFieldName)!.value;
    return this.truncate(link, type === 'WhatsApp' ? 20 : 45);
  }

  truncate(text: string, length: number): string {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  calculateAge(birthYear: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return age < 18 ? 18 : age; // Si la edad es menor a 18, devuelve 18
  }

  // close
  onCloseModal() {
    this.dialogService.closeModal();
  }

  // get media details
  getMediaDetails(item: any): PostMediaDetails | null {
    return this.postMediaService.getBackgroundImageUrl(item);
  }

  // input class
  inputClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return UIStyles.textareaClass(formGroup, controlName, height);
  }

  cardClass() {
    return UIStyles.cardClass();
  }

  modalClass() {
    return UIStyles.modalClass();
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

}

