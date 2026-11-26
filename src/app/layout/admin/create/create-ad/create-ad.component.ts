import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule, isPlatformBrowser, isPlatformServer, Location } from '@angular/common';
import { ChangeDetectorRef, Component, effect, ElementRef, EventEmitter, inject, Input, Output, PLATFORM_ID, QueryList, signal, ViewChild, ViewChildren, ViewContainerRef, WritableSignal, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, ActivationEnd, Router } from '@angular/router';
import { NumericValidator, PricePostValidator } from '@core/common/custom-validators.ts';
import { UIStyles } from '@core/common/uistyles';
import { FileMedia } from '@interfaces/fileMedia';
import { PostMedia } from '@interfaces/postMedia';
import { Tag } from '@interfaces/tag';
import { User } from '@interfaces/user';
import { SpinnerService } from '@services/spinner.service';
import { ToastService } from '@services/toast.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { CloudflareService } from '@services/cloudflare.service';
import { DialogService } from '@services/dialog.service';
import { PostMediaService } from '@services/post-media.service';
import { PostService } from '@services/post.service';
import { filter, find, Subject, Subscription, takeUntil } from 'rxjs';
import { environment } from '@environments/environment';
import { Post } from '@interfaces/post';
import { v4 as uuidv4 } from 'uuid';
import { IconDirective } from '@directive/coin-svg.directive';
import { CountryService } from '@services/country.service';
import { Country } from '@interfaces/country';
import { CountryState } from '@interfaces/countryState';
import { CountryStateService } from '@services/country-state.service';
import { AutoResizeTextareaDirective } from '@directive/auto-resize-textarea.directive';
import { FollowService } from '@services/follow.service';
import { StateCity } from '@interfaces/stateCity';
import { StateCityService } from '@services/state-city.service';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-create-ad',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    CommonModule,
    IconDirective,
    AutoResizeTextareaDirective
  ],
  templateUrl: './create-ad.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './create-ad.component.scss'
})
export default class CreateAdComponent {

  isBrowser: boolean;
  isServer: boolean;
  maxSizeInMB = environment.maxSizeInMB;

  post = signal<Post | null>(null);

  myform: FormGroup;

  typeViewArray = [
    //{name: 'payment', value: 'PAYMENT'},
    { name: 'subscribers', value: 'SUBSCRIBERS' },
    { name: 'free', value: 'FREE' }
  ]

  filesArray: WritableSignal<PostMedia[]> = signal([]);

  selectedFiles: PostMedia[] = [];
  tagArray: Tag[] = [];
  type = 'AD';

  countries = signal<Country[] | null>(null);
  countryStates = signal<CountryState[] | null>(null);
  stateCyties = signal<StateCity[] | null>(null);
  idCountry = signal('');

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;
  private destroy$ = new Subject<void>();
  @Output() closeModal = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  public postService = inject(PostService);
  public authService = inject(AuthService);
  private spinnerService = inject(SpinnerService);
  private sanitizer = inject(DomSanitizer);
  private toastService = inject(ToastService);
  private cloudflareService = inject(CloudflareService);
  private postMediaService = inject(PostMediaService);
  private location = inject(Location);
  public dialogService = inject(DialogService);
  private platformId = inject(PLATFORM_ID);
  public document = inject(DOCUMENT);
  private router = inject(Router);
  private countryService = inject(CountryService);
  private countryStateService = inject(CountryStateService);
  private stateCityService = inject(StateCityService);
  private userService = inject(UserService);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.tagArray = this.authService.user()?.Tag || [];

    effect(() => {
      this.post.set(this.postService.post());
    });
  }

  async ngOnInit() {
    this.createFormControls();
    await this.findAllCountries();

    if (this.post()) {
      this.editForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.onDiscard();

    if (this.idCountry()) {
      this.updateUser(this.idCountry());
    }
  }

  createFormControls() {

    const typeViewDefault = 'FREE';

    this.myform = new FormGroup({
      fileImages: new FormControl(null, [Validators.required]),
      title: new FormControl('', [Validators.required, Validators.minLength(5)]),
      description: new FormControl('', Validators.required),
      typeView: new FormControl(typeViewDefault, Validators.nullValidator),
      link: new FormControl('', Validators.nullValidator),
      isComment: new FormControl(true, Validators.nullValidator),
      isPreviewMedia: new FormControl(false, Validators.nullValidator),
      isProfile: new FormControl(true, Validators.nullValidator),

      country: new FormControl('', Validators.required),
      countryState: new FormControl('', Validators.nullValidator),
      stateCity: new FormControl('', Validators.nullValidator),
      phonePrefix: new FormControl('', [Validators.required]),
      whatsapp: new FormControl('', [Validators.nullValidator, NumericValidator]),
      telegram: new FormControl('', [Validators.required]),
    });

    this.myform.get('typeView')?.disable();

  }

  editForm() {

    if (this.post()?._id) {
      this.myform.get('fileImages')?.clearValidators(); // Eliminar validación requerida
    } else {
      this.myform.get('fileImages')?.setValidators(Validators.required); // Restaurar validación requerida
    }
    this.myform.get('fileImages')?.updateValueAndValidity(); // Aplicar cambios

    const typeViewDefault = 'FREE';

    this.myform.get('typeView')?.enable();

    if (this.post()) {
      this.myform.patchValue({
        title: this.post()?.title,
        description: this.post()?.description,
        link: this.post()?.link,
        credit: Number(this.post()?.credit),
        isComment: this.post()?.isComment || false,
        typeView: this.post()?.typeView || typeViewDefault,
        isPreviewMedia: this.post()?.isPreviewMedia || false,
        isProfile: this.post()?.isProfile || false,

        country: this.post()?.Country?._id,
        countryState: this.post()?.CountryState?._id,
        stateCity: this.post()?.StateCity?._id,
        phonePrefix: this.post()?.phonePrefix,
        whatsapp: this.post()?.whatsapp,
        telegram: this.post()?.telegram,
      });

      this.selectedFiles = this.post()?.PostMedia || [];
    }
  }

  // countries
  async findAllCountries() {
    const countries = await this.countryService.findAllDatting();
    this.countries.set(countries);

    if (this.post()) {
      const idCountry = this.post()?.Country?._id!;
      const dataCountryState = {
        Country: idCountry
      };
      const countryStates = await this.countryStateService.findAllCountry(dataCountryState);
      this.countryStates.set(countryStates);
      const IdCountryState = this.post()?.CountryState?._id!;
      const stateCyties = await this.stateCityService.findAllCountryState(IdCountryState);
      this.stateCyties.set(stateCyties);
    } else {
      const countryDefault = this.authService.user()?.CountryAd || this.authService.user()?.Country;
      const idCountry = countryDefault?._id || environment.countryDefault;
      await this.findCountryState(idCountry);
      const country = this.countries()?.find(item => item._id === idCountry);
      this.myform.patchValue({
        country: idCountry,
        countryState: this.countryStates()!.length > 0 ? this.countryStates()![0]._id : null,
        phonePrefix: country?.phonePrefix,
      });
    }
  }

  async onCountryState(e: any) {
    this.findCountryState(e.target.value);
  }

  async findCountryState(idCountry: string) {
    const data = {
      Country: idCountry
    };
    const countryStates = await this.countryStateService.findAllCountry(data);
    this.countryStates.set(countryStates);
    this.defaultCountryState();
  }

  defaultCountryState() {
    const idCountryState = this.countryStates()![0]._id!;
    this.findStateCity(idCountryState);
  }

  async onStateCity(e: any) {
    this.findStateCity(e.target.value);
  }

  async findStateCity(idCountryState: string) {
    const countryState = this.countryStates()?.find(item => item._id == idCountryState);
    const IdCountryState = countryState?._id!;
    const stateCyties = await this.stateCityService.findAllCountryState(IdCountryState);
    this.stateCyties.set(stateCyties);

    this.myform.patchValue({
      stateCity: this.stateCyties()!.length > 0 ? this.stateCyties()![0]._id : null
    });

  }

  // upload file
  onFileChange(event: any) {

    if (event.target.files && event.target.files[0]) {
      const maxSizeInMB = this.maxSizeInMB;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

      var i = Number(0);
      for (let file of event.target.files) {
        if (file.size >= maxSizeInBytes) {
          this.toastService.start({ type: 'error', message: `fileTooLarge` });
          return;
        }

        const name = `post-${uuidv4()}`;
        const mimetype = event.target.files[i].type.split('/')[1];
        let myNewFile: any = new File([event.target.files[i]], `${name}.${mimetype}`, { type: event.target.files[i].type });

        var reader = new FileReader();
        reader.onload = (e: any) => {
          const newFile: PostMedia = {
            _id: `${name}`,
            typeFile: file.type.split('/'),
            url: e.target.result,
            type: 'ORIGINAL',
            cover: false,
            file: myNewFile
          };

          this.filesArray.update((prevFiles) => [...prevFiles, newFile]);

        };

        reader.readAsDataURL(event.target.files[i]);
        i++;
      }

    }
  }

  onTagChangeText(tag: string) {
    const text = this.myform.value.description || '';
    const textUpdate = text ? `${text} #${tag}` : `#${tag}`;
    this.myform.patchValue({
      description: textUpdate
    });
  }

  transformAge(birthYear: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return age < 18 ? 18 : age; // Si la edad es menor a 18, devuelve 18
  }

  // create
  async onSubmit() {

    this.dialogService.closeModal();

    const formValues = this.myform.getRawValue();

    if (this.myform.valid && this.authService.user()) {
      this.spinnerService.start();

      const createPostMedia: any = [];
      this.idCountry.set(formValues.country);

      const data = {
        filesArray: createPostMedia,
        title: formValues.title,
        link: formValues.link,
        description: formValues.description,
        credit: Number(formValues.credit) || 0,
        isComment: formValues.isComment,
        typeView: formValues.typeView,
        isPreviewMedia: formValues.isPreviewMedia,
        isProfile: formValues.isProfile,
        type: this.type,

        age: this.transformAge(this.authService.user()?.age!),
        gender: this.authService.user()?.gender,
        Country: formValues.country,
        CountryState: formValues.countryState,
        StateCity: formValues.stateCity,
        telegram: formValues.telegram,
        phonePrefix: formValues.phonePrefix,
        whatsapp: formValues.whatsapp,
      }

      const uploadPromises = this.filesArray().map(async (item: any) => {
        try {
          const additionalObject: any = {
            type: item.file.type!.split('/')[0],
            extension: item.file.type!.split('/')[1],
          };
          if (item.file.type!.split('/')[0] == 'video') {
            const resVideo = await this.cloudflareService.uploadToVideoCloudflare(item.file);
            if (resVideo) {
              additionalObject.cloudflare = resVideo;
            }
          } else if (item.file.type!.split('/')[0] == 'image') {
            const resImage = await this.cloudflareService.uploadToImageCloudflare(item.file);
            if (resImage !== null) {
              additionalObject.cloudflare = resImage;
            }
          }

          if (additionalObject.cloudflare) {
            data.filesArray.push(additionalObject);
          }

        } catch (error) {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        }
      });

      Promise.all(uploadPromises).then(() => {
        if (this.post()) {
          this.update(data);
        } else {
          if (data.filesArray.length > 0) {
            this.create(data);
          } else {
            this.spinnerService.close();
            this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
          }
        }
      });

    }
  }

  // create
  async create(data: any) {

    this.postService.create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            const currentPostAd = this.postService.postAds();
            const updatedPostAd = [res, ...currentPostAd];
            this.postService.addPostAds(updatedPostAd);
            this.postService.addPost(res);

            this.onDiscard();

            const postLink = `${res.slug}`;
            this.followersSendEmail(postLink);
          }
        },
        error: (err) => {
          this.onCloseModal();
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
        },
        complete: () => {
          this.onCloseModal();
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
          console.log('Request completed');
        }
      });
  }

  // uptate
  async update(data: any) {
    this.postService.update(this.post()?._id!, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {

            if (res.typeView === 'SUBSCRIBERS') {
              this.postService.removePostAds(this.post()?._id!);
              this.postService.resetPost();
            } else {
              this.postService.updatePostAds(this.post()!._id!, {
                title: res.title,
                link: res.link,
                description: res.description,
                credit: res.credit,
                isComment: res.isComment,
                typeView: res.typeView,
                isPreviewMedia: res.isPreviewMedia,
                isProfile: res.isProfile,
                tags: res.tags,
                PostMedia: res.PostMedia,

                age: res.age,
                gender: res.gender,
                Country: res.Country,
                CountryState: res.CountryState,
                StateCity: res.StateCity,

                telegram: res.telegram,
                phonePrefix: res.phonePrefix,
                whatsapp: res.whatsapp,
              });
            }

            res.User = this.authService.user()!;
            this.postService.addPost(res);
          }
          this.onDiscard();
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
          this.onCloseModal();
          // this.router.navigateByUrl(this.post()!.User?.username!);
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
          this.onCloseModal();
          // this.router.navigateByUrl(this.post()!.User?.username!);
          console.log('Request completed');
        }
      });
  }

  async updateUser(CountryId: string) {

    this.spinnerService.start();
    const data = {
      CountryAd: CountryId
    }
    const userId = this.authService.user()?._id;
    this.userService.update(userId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.authService.updateUser({
            CountryAd: res.CountryAd
          });
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

  // reset form 
  onDiscard() {
    this.post.set(null);
    this.filesArray.set([]);
    this.selectedFiles = [];
    this.myform.reset();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';

  }

  // delete
  deleteImage(file: any) {
    this.filesArray.update((prevFiles) =>
      prevFiles.filter((item) => item._id !== file._id)
    );
    if (this.filesArray().length === 0) {
      this.myform.patchValue({ fileImages: null });
    }
  }

  deleteFile(file: PostMedia): void {
    this.spinnerService.start();
    const data = {
      PostMedia: file._id
    }
    this.postMediaService.deletePost(data).subscribe(res => {
      if (res) {
        this.selectedFiles = this.selectedFiles.filter((item: any) => item._id !== file._id);

        if (this.selectedFiles.length == 0) {
          this.myform.patchValue({
            fileImages: null,
          });
        }
        this.spinnerService.close();
      }
    })
  }

  onCloseModal() {
    this.closeModal.emit();
  }

  // send email
  async followersSendEmail(postLink: string) {

    if (!this.authService.user()) {
      return;
    }

    const data = {
      postLink: postLink
    };
    const userId = this.authService.user()?._id!;
    await this.postService.createPostNotification(data, userId);
  }

  // cheked
  checked(tag: string) {
    return true
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  // input class
  selectClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  inputClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return UIStyles.textareaClass(formGroup, controlName, height);
  }

  cardModalClass() {
    return UIStyles.cardModalClass();
  }

  modalClass() {
    return UIStyles.modalClass();
  }

  buttonClass() {
    return UIStyles.buttonClass();
  }

  buttonSecondaryClass() {
    return UIStyles.buttonSecondaryClass();
  }
}

