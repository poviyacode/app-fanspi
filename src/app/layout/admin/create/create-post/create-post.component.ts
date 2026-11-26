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
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { environment } from '@environments/environment';
import { Post } from '@interfaces/post';
import { v4 as uuidv4 } from 'uuid';
import { IconDirective } from '@directive/coin-svg.directive';
import { AutoResizeTextareaDirective } from '@directive/auto-resize-textarea.directive';
import { FollowService } from '@services/follow.service';

@Component({
  selector: 'app-create-post',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    CommonModule,
    IconDirective,
    AutoResizeTextareaDirective
  ],

  templateUrl: './create-post.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './create-post.component.scss'
})
export default class CreatePostComponent {

  isBrowser: boolean;
  isServer: boolean;
  maxSizeInMB = environment.maxSizeInMB;

  post = signal<Post | null>(null);

  myform: FormGroup;

  typeViewArray = [
    //{name: 'payment', value: 'PAYMENT'},
    //{ name: 'subscribers', value: 'SUBSCRIBERS' },
    { name: 'free', value: 'FREE' }
  ]

  filesArray: WritableSignal<PostMedia[]> = signal([]);

  selectedFiles: PostMedia[] = [];
  tagArray: Tag[] = [];
  type = 'POST';

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
  private followService = inject(FollowService);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.tagArray = this.authService.user()?.Tag || [];

    const user = this.authService.user()!;
    if (user.status === 'SUSPENDED') {
      const route = `/${user.username}`;
      this.router.navigateByUrl(`${route}`).then(() => {
        //window.location.reload();
      });

    }

    effect(() => {
      this.post.set(this.postService.post());

      if (this.post()) {
        this.editForm();
      }

    });
  }

  ngOnInit(): void {
    this.createFormControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.onDiscard();

  }

  createFormControls() {

    const typeViewDefault = 'FREE';

    this.myform = new FormGroup({
      fileImages: new FormControl(null, [Validators.required]),
      title: new FormControl('', [Validators.nullValidator, Validators.minLength(5)]),
      description: new FormControl('', Validators.nullValidator),
      typeView: new FormControl(typeViewDefault, Validators.nullValidator),
      link: new FormControl('', Validators.nullValidator),
      isComment: new FormControl(true, Validators.nullValidator),
      isPreviewMedia: new FormControl(false, Validators.nullValidator),
      isDownload: new FormControl(false, Validators.nullValidator),
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

    this.typeViewArray.push({ name: 'sendToExitada', value: 'EXITADA' });

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
        isDownload: this.post()?.isDownload || false
      });

      this.selectedFiles = this.post()?.PostMedia || [];
    }
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

  // create
  async onSubmit() {

    const formValues = this.myform.getRawValue();

    if (this.myform.valid && this.authService.user()) {
      this.spinnerService.start();

      const createPostMedia: any = [];

      const data = {
        filesArray: createPostMedia,
        title: formValues.title,
        link: formValues.link,
        description: formValues.description,
        credit: Number(formValues.credit) || 0,
        isComment: formValues.isComment,
        typeView: formValues.typeView,
        isPreviewMedia: formValues.isPreviewMedia,
        isDownload: formValues.isDownload,
        type: this.type
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
            const currentPostsUser = this.postService.postsUser();
            const updatedPostsUser = [res, ...currentPostsUser];
            this.postService.addPostsUser(updatedPostsUser);
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

            const poToUpdatePostsUser = this.postService.postsUser().find((item) => item._id === this.post()?._id);
            if (poToUpdatePostsUser) {

              if (res.typeView === 'SUBSCRIBERS' || res.Site?._id !== environment.site) {
                this.postService.removePosts(this.post()?._id!);
                this.postService.removePostsUser(this.post()?._id!);
                this.postService.resetPost();
              } else {
                this.postService.updatePostsUser(this.post()!._id!, {
                  title: res.title,
                  link: res.link,
                  description: res.description,
                  credit: res.credit,
                  isComment: res.isComment,
                  isProfile: res.isProfile,
                  isDownload: res.isDownload,
                  typeView: res.typeView,
                  isPreviewMedia: res.isPreviewMedia,
                  tags: res.tags,
                  PostMedia: res.PostMedia
                });
              }

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
