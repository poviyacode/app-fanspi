import { CommonModule, isPlatformBrowser, isPlatformServer, Location, NgOptimizedImage } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, OnInit, OnChanges, ViewChildren, QueryList, Inject, PLATFORM_ID, inject, signal, effect, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { textNumberValidator } from '@core/common/custom-validators.ts';
import { UIStyles } from '@core/common/uistyles';
import { Country } from '@interfaces/country';
import { CountryState } from '@interfaces/countryState';
import { User } from '@interfaces/user';
import { SpinnerService } from '@services/spinner.service';
import { ToastService } from '@services/toast.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { CloudflareService } from '@services/cloudflare.service';
import { CountryStateService } from '@services/country-state.service';
import { CountryService } from '@services/country.service';
import { DialogService } from '@services/dialog.service';
import { PostMediaService } from '@services/post-media.service';
import { PostService } from '@services/post.service';
import { UserService } from '@services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { IconDirective } from '@directive/coin-svg.directive';

@Component({
  selector: 'app-personal-setting',
  imports: [NgOptimizedImage,
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    CommonModule,
    IconDirective
  ],
  templateUrl: './personal-setting.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./personal-setting.component.scss']
})
export default class PersonalSettingComponent {

  isBrowser: boolean;
  isServer: boolean;

  @ViewChild('video') videoRef!: ElementRef;
  @ViewChild('canvas') canvasRef!: ElementRef;

  frontImage: string | null = null;
  backImage: string | null = null;

  countries = signal<Country[] | null>(null);
  countryStates = signal<CountryState[] | null>(null);

  myForm: FormGroup;
  private destroy$ = new Subject<void>();

  genderArray: any[] = [
    { value: 'MAN', name: 'man' }, { value: 'WOMAN', name: 'woman' },
  ];

  daysOfMonth: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  monthsOfYear: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  currentYear: number = new Date().getFullYear();
  minAge: number = 18;
  maxAge: number = 60;
  birthYears: number[]

  latitude: number;
  longitude: number;

  private postService = inject(PostService);
  public authService = inject(AuthService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private spinnerService = inject(SpinnerService);
  private sanitizer = inject(DomSanitizer);
  private toastService = inject(ToastService);
  private postMediaService = inject(PostMediaService);
  private location = inject(Location);
  private dialogService = inject(DialogService);
  private platformId = inject(PLATFORM_ID);
  public document = inject(DOCUMENT);
  public countryService = inject(CountryService);
  private countryStateService = inject(CountryStateService);
  private cloudflareService = inject(CloudflareService);
  private userService = inject(UserService);

  constructor(
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    this.birthYears = Array.from({ length: this.maxAge - this.minAge + 1 }, (_, i) => this.currentYear - this.minAge - i);

    effect(() => {
      if (this.isBrowser) {
        if (this.authService.user()!.statusPersonal === 'PENDING' || this.authService.user()!.statusPersonal === 'RESUBMIT_DATA') {
          this.startCamera();
          this.getLocation();
          this.findAllCountries();
        } else if (this.authService.user()!.statusPersonal === 'APPROVED') {
          this.router.navigate(['/']);
        }
      }
    });
  }

  ngOnInit(): void {
    this.createFormControls();
  }

  ngOnChanges() {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFormControls() {
    this.myForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      lastname: new FormControl('', Validators.required),
      idIdentification: new FormControl('', Validators.required),
      gender: new FormControl(this.authService.user()?.gender || 'WOMAN', Validators.required),
      dateBirth: new FormControl('', Validators.required),
      country: new FormControl('', Validators.required),
      countryState: new FormControl('', Validators.required),
      city: new FormControl('', [Validators.required, Validators.minLength(2), textNumberValidator]),
      addressLine1: new FormControl('', [Validators.required, Validators.minLength(2), textNumberValidator]),
      postalCode: new FormControl('', Validators.required),
      phonePrefix: new FormControl('', Validators.required),
      phone: new FormControl('', Validators.required),
      fileFrontImages: new FormControl('', [Validators.required]),
      fileBackImages: new FormControl('', [Validators.required]),
    });
  }

  async onSubmit() {
    if (this.myForm.valid && this.authService.user()) {

      this.spinnerService.start();

      //const fileFront = this.dataURItoBlob(this.frontImage!);
      //const fileBack = this.dataURItoBlob(this.backImage!);

      const blobFront = this.dataURItoBlob(this.frontImage!);
      const fileFront = new File([blobFront], 'front_image.jpg', { type: blobFront.type });

      const blobBack = this.dataURItoBlob(this.backImage!);
      const fileBack = new File([blobBack], 'back_image.jpg', { type: blobBack.type });

      const createPostMedia: any = [
        {
          type: fileFront.type.split('/')[0],
          extension: fileFront.type.split('/')[1],
        },
        {
          type: fileBack.type.split('/')[0],
          extension: fileBack.type.split('/')[1],
        }
      ];

      const resFrontImage = await this.cloudflareService.uploadToImageCloudflare(fileFront);
      const resBackImage = await this.cloudflareService.uploadToImageCloudflare(fileBack);


      if (resFrontImage !== null) {
        createPostMedia[0].cloudflare = resFrontImage;
      }

      if (resFrontImage !== null) {
        createPostMedia[1].cloudflare = resBackImage;
      }

      const country = this.countries()?.find(item => item.code == this.myForm.value.country);
      const countryState = this.countryStates()?.find(item => item.code == this.myForm.value.countryState);

      const data = {
        filesArray: createPostMedia,
        name: this.myForm.value.name,
        lastname: this.myForm.value.lastname,
        idIdentification: this.myForm.value.idIdentification,
        gender: this.myForm.value.gender,
        dateBirth: `${this.myForm.value.dateBirth}`,
        Country: country?._id,
        CountryState: countryState?._id,
        city: this.myForm.value.city,
        addressLine1: this.myForm.value.addressLine1,
        postalCode: this.myForm.value.postalCode,
        phonePrefix: this.myForm.value.phonePrefix,
        phone: this.myForm.value.phone,
        location: {
          latitude: this.latitude,
          longitude: this.longitude
        }
      }

      this.userService.createPersonal(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {
              this.createFormControls();
              const updatedUser: User = {
                ...this.authService.user(),
                statusPersonal: res.statusPersonal
              };
              this.authService.addUser(updatedUser);
              this.spinnerService.close();
              this.toastService.start({ type: 'success', message: 'completedSuccessfully' });
            }
          },
          error: (err) => {
            this.spinnerService.close();
            this.toastService.start({ type: 'error', message: 'pleaseTryAgain' });
          },
          complete: () => {
            console.log('Request completed');
          }
        });
    }
  }

  findAllCountries() {
    this.countryService.findAllPhone().subscribe(res => {
      if (res) {
        this.countries.set(res);
        this.defaultCountry();
      }
    });
  }

  async onCountryState(e: any) {
    this.findCountryState(e.target.value);
  }

  defaultCountry() {
    const code = 'US';
    this.findCountryState(code);
    const country = this.countries()?.find(item => item.code == code);
    this.myForm.patchValue({
      country: code,
      phonePrefix: country?.phonePrefix
    });
  }

  async findCountryState(code: string) {
    const data = {
      code: code
    };

    const countryStates = await this.countryStateService.findAllSearchCode(data);
    this.countryStates.set(countryStates);
    this.myForm.patchValue({
      countryState: this.countryStates()!.length > 0 ? this.countryStates()![0].code : null
    });
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      console.error('La geolocalización no es soportada por este navegador.');
    }
  }

  // camera
  isFrontCapture: boolean = true;

  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoRef.nativeElement.srcObject = stream;
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
    }
  }

  capturePhoto(side: 'front' | 'back') {
    const video = this.videoRef.nativeElement as HTMLVideoElement;
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/png');
      if (side === 'front') {
        this.frontImage = imageDataUrl;
        this.myForm.patchValue({ fileFrontImages: 1 });
      } else if (side === 'back') {
        this.backImage = imageDataUrl;
        this.myForm.patchValue({ fileBackImages: 1 });
      }
    }
  }

  retakePhoto(side: 'front' | 'back') {
    this.frontImage = null;
    this.myForm.patchValue({
      fileFrontImages: null,
      fileBackImages: null,
    });
    this.startCamera();
  }

  toggleCaptureSide(side: 'front' | 'back') {
    this.isFrontCapture = side === 'front';
  }

  submitDocument() {
    const formData = new FormData();
    if (this.frontImage) {
      formData.append('frontImage', this.dataURItoBlob(this.frontImage), 'front.png');
    }
    if (this.backImage) {
      formData.append('backImage', this.dataURItoBlob(this.backImage), 'back.png');
    }

    // Aquí deberías hacer la solicitud HTTP para enviar el formData a tu backend
    // Ejemplo: this.http.post('URL_DE_TU_API', formData).subscribe(...);
  }

  dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([intArray], { type: 'image/png' });
  }

  goBack(): void {
    this.location.back();
  }

  onScrollTop(): void {
    this.document.documentElement.scrollTop = 0;
  }

  // input class
  inputClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return UIStyles.textareaClass(formGroup, controlName, height);
  }

  selectClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  buttonClass() {
    return UIStyles.buttonClass();
  }

  buttonSecondaryClass() {
    return UIStyles.buttonSecondaryClass();
  }
}

