import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, inject, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import {
  AgeValidator,
  validateUsernameRequired,
  validatePhoneRequired,
  NumericValidator,
  fileTypeValidator,
  urlValidator,
  usernameValidator,
  fileTypeImageValidator,
} from '@core/common/custom-validators.ts';
import { UIStyles } from '@core/common/uistyles';
import { environment } from '@environments/environment';
import { PostMedia } from '@interfaces/postMedia';
import { SocialMedia } from '@interfaces/socialMedia';
import { Tag } from '@interfaces/tag';
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
import { filter, Subject, takeUntil } from 'rxjs';
import { Country } from '@interfaces/country';
import { IconDirective } from '@directive/coin-svg.directive';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import { CalculateAgePipe } from '@pipes/calculate-age.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';

@Component({
  selector: 'app-profile-admin',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    IconDirective
  ],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile.component.scss'
})
export default class ProfileComponent {
  loading: boolean;
  videoCoverUrl: any;
  videoProfileUrl: any;

  myformCover: FormGroup;
  myformProfile: FormGroup;
  myformInfo: FormGroup;

  countriesPhone = signal<Country[] | null>(null);
  countriesDatting = signal<Country[] | null>(null);

  maxSizeInMB = environment.maxSizeInMB;

  private destroy$ = new Subject<void>();

  socialMediaArray: any[] = [
    {
      icon: './public/social-media/whatsapp.png',
      type: 'WhatsApp',
      url: 'https://wa.me/',
    },
    {
      icon: './public/social-media/facebook.png',
      type: 'Facebook',
      url: 'https://www.facebook.com/',
    },
    {
      icon: './public/social-media/twitter.png',
      type: 'Twitter',
      url: 'https://twitter.com/',
    },
    {
      icon: './public/social-media/youtube.png',
      type: 'YouTube',
      url: 'https://www.youtube.com/',
    },
    {
      icon: './public/social-media/telegram.png',
      type: 'Telegram',
      url: 'https://t.me/',
    },
    {
      icon: './public/social-media/onlyfans.png',
      type: 'Onlyfans',
      url: 'https://www.onlyfans.com/',
    },
    {
      icon: './public/social-media/instagram.png',
      type: 'Instagram',
      url: 'https://www.instagram.com/',
    },
    {
      icon: './public/social-media/tiktok.png',
      type: 'TikTok',
      url: 'https://www.tiktok.com/@',
    },
    {
      icon: './public/social-media/amazon.png',
      type: 'Amazon',
      url: 'https://www.amazon.com/',
    },
    {
      icon: './public/social-media/linkedin.png',
      type: 'Linkedin',
      url: 'https://www.linkedin.com/',
    },
    {
      icon: './public/social-media/twitch.png',
      type: 'Twitch',
      url: 'https://www.twitch.tv/',
    },
    {
      icon: './public/social-media/snapchat.png',
      type: 'Snapchat',
      url: 'https://www.snapchat.com/',
    },
    {
      icon: './public/social-media/discord.png',
      type: 'Discord',
      url: 'https://discord.com/',
    },
    {
      icon: './public/social-media/patreon.png',
      type: 'Patreon',
      url: 'https://www.patreon.com/',
    },
    {
      icon: './public/social-media/pinterest.png',
      type: 'Pinterest',
      url: 'https://www.pinterest.com/',
    },
    {
      icon: './public/social-media/likee.png',
      type: 'Likee',
      url: 'https://www.likee.video/',
    },
    {
      icon: './public/social-media/etsy.png',
      type: 'Etsy',
      url: 'https://www.etsy.com/',
    },
    { icon: './public/social-media/website.png', type: 'website', url: '' }, // Reemplaza esto con tu URL
  ];

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

  constructor() {
    this.createFormPersonalizationControls();
  }

  ngOnInit(): void {
    if (this.authService.user()) {

    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    //reset
    this.countriesPhone.set(null);
    this.countriesDatting.set(null);
  }

  // personalization
  imagesCover: any[] = [];
  selectedFilesCover: any[] = [];
  imagesProfile: any[] = [];
  selectedFilesProfile: any[] = [];

  createFormPersonalizationControls() {
    this.myformProfile = this.fb.group({
      file: ['', Validators.required, fileTypeImageValidator],
    });
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
        };
        reader.readAsDataURL(event.target.files[i]);
        i++;
      }
    }
  }

  deleteImageProfile(file: any) {
    this.imagesProfile.splice(this.imagesProfile.indexOf(file), 1);
    if (this.imagesProfile.length == 0) {
      this.myformProfile.patchValue({
        file: null,
      });
    }
  }

  deleteFileProfile(item: PostMedia): void {

    this.spinnerService.start();

    const data = {
      PostMedia: item._id,
    };
    this.postMediaService
      .deleteProfile(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.myformProfile.patchValue({
              file: null,
            });
            this.imagesProfile = [];
            const updatedUser: User = {
              ...this.authService.user(),
              Profile: res.Profile,
            };
            this.authService.addUser(updatedUser);
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
          console.log('Request completed');
        },
      });
  }

  async onSubmitProfile() {
    if (this.myformProfile.valid) {
      this.spinnerService.start();
      const createPostMedia: any = [];

      for (const item of this.imagesProfile) {
        const file = item.file;
        const additionalObject: any = {
          type: file.type.split('/')[0],
          extension: file.type.split('/')[1],
        };
        if (file.type.split('/')[0] == 'video') {
          try {
            const resVideo =
              await this.cloudflareService.uploadToVideoCloudflare(file);
            additionalObject.cloudflare = resVideo;
          } catch (error) {
            this.toastService.start({
              type: 'error',
              message: 'pleaseTryAgain',
            });
            return;
          }
        } else if (file.type.split('/')[0] == 'image') {
          try {
            const resImage =
              await this.cloudflareService.uploadToImageCloudflare(file);
            additionalObject.cloudflare = resImage;
          } catch (error) {
            this.toastService.start({
              type: 'error',
              message: 'pleaseTryAgain',
            });
            return;
          }
        }
        createPostMedia.push(additionalObject);
      }

      const data = {
        Site: this.authService.user()!.Site?._id,
        filesArray: createPostMedia,
      };

      this.userService
        .profile(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {
              const updatedUser: User = {
                ...this.authService.user(),
                Profile: res.Profile,
              };
              this.authService.addUser(updatedUser);
              this.imagesProfile = [];
              this.selectedFilesCover = this.authService.user()!.Cover!;

              this.spinnerService.close();
              this.toastService.start({
                type: 'success',
                message: 'completedSuccessfully',
              });
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
            console.log('Request completed');
          },
        });
    }
  }

}
