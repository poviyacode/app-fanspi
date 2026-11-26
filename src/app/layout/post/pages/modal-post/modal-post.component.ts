import { Component, effect, HostListener, inject, signal, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { PostService } from '@services/post.service';
import { SubscriptionService } from '@services/subscription.service';
import { Subscription } from '@interfaces/subscription';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PostMedia } from '@interfaces/postMedia';
import { Post } from '@interfaces/post';
import { CommentsPostComponent } from '../comments-post/comments-post.component';
import { DropdownPostComponent } from '../dropdown-post/dropdown-post.component';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { BookmarkService } from '@services/bookmark.service';
import { SpinnerService } from '@services/spinner.service';
import { ToastService } from '@services/toast.service';
import CreatePostComponent from '@layout/admin/create/create-post/create-post.component';
import { environment } from '@environments/environment';
import { TipComponent } from '@shared/tip/tip.component';
import { TipService } from '@services/tip.service';
import { ThousandsPipe } from '@pipes/thousands.pipe';
import { IconDirective } from '@directive/coin-svg.directive';
import { User } from '@interfaces/user';

@Component({
  selector: 'app-modal-post',
  imports: [
    RouterLink,
    CustomTranslatePipe,
    ThousandsPipe,
    IconDirective
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
  templateUrl: './modal-post.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './modal-post.component.scss'
})
export class ModalPostComponent {

  loading = false;

  currentIndex: number;
  currentLinghtbox = signal<PostMedia | null>(null);
  autoplay: boolean = false;
  currentPrivate: boolean = false;

  touchStartX: number = 0;
  touchStartY: number = 0;
  changeOccurred: boolean = false;
  transformStyle = '';
  videoUrl: SafeResourceUrl | undefined;

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;

  public dialogService = inject(DialogService);
  location = inject(Location);
  authService = inject(AuthService);
  router = inject(Router);
  postService = inject(PostService);
  subscriptionService = inject(SubscriptionService);
  sanitizer = inject(DomSanitizer);
  bookmarkService = inject(BookmarkService);
  spinnerService = inject(SpinnerService);
  toastService = inject(ToastService);
  tipService = inject(TipService);

  constructor() {
    effect(() => {
      if (this.postService.post()) {
        this.currentIndex = this.postService.post()!.currentIndex! ? this.postService.post()!.currentIndex! : 0;
        if (this.postService.post()!.PostMedia!.length! > 0) {
          this.currentLinghtbox.set(this.postService.post()!.PostMedia!![this.currentIndex]);
        }

        this.currentMedia(this.currentIndex);
        this.updateVideoUrl();
      }
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

  currentMedia(index: number) {
    let currentPrivate = false;

    const media = this.postService.post()!.PostMedia![index];
    const typeView = media?.Post?.typeView || media?.Message?.typeView;

    if (typeView === 'FREE' || this.authService?.user()?._id === media?.User?._id) {
      currentPrivate = false;
    } else {
      if (media.Post) {
        const subscription = this.subscriptionService.searchSubscribersUserJoin(media.User?.username!);
        if (!subscription) {
          currentPrivate = true;
        }
      } else if (media.Message) {
        if (typeView === 'PAYMENT') {
          currentPrivate = true;
        }
      }
    }
    this.currentPrivate = currentPrivate;
  }

  closeModal() {
    this.dialogService.closeModal();
    const dataUpdate = {};
    this.postService.latestPost(dataUpdate).subscribe();
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.changeOccurred = false;
  }

  onTouchMove(event: TouchEvent): void {
    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;
    const deltaX = this.touchStartX - touchEndX;
    const deltaY = this.touchStartY - touchEndY;

    if (!this.changeOccurred) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > 5) {
          if (deltaX > 0) {
            this.nextCarouselMedia();
            this.changeOccurred = true;
          } else {
            this.prevCarouselMedia();
            this.changeOccurred = true;
          }
        }
      } else {
        //console.log('y');
      }
    }
  }

  prevCarouselMedia() {
    this.currentIndex = this.currentIndex === 0 ? this.postService.post()!.PostMedia!.length - 1 : this.currentIndex - 1;
    this.transformStyle = `translateX(-${this.currentIndex * 100}%)`;
    this.currentLinghtbox.set(this.postService.post()!.PostMedia![this.currentIndex]);
    this.currentMedia(this.currentIndex);
    this.updateVideoUrl();
  }

  nextCarouselMedia() {
    this.currentIndex = (this.currentIndex + 1) % this.postService.post()!.PostMedia!.length;
    this.transformStyle = `translateX(-${this.currentIndex * 100}%)`;
    this.currentLinghtbox.set(this.postService.post()!.PostMedia![this.currentIndex]);
    this.currentMedia(this.currentIndex);
    this.updateVideoUrl();
  }

  updateVideoUrl() {
    const postMedia = this.postService.post()!.PostMedia![this.currentIndex];

    if (postMedia.type == 'video') {
      const { uid, thumbnail } = postMedia.cloudflare.result;
      const autoplayParam = this.currentPrivate ? 'autoplay=true' : 'autoplay=false';
      const videoUrl = `https://customer-6kruyx7h361tmu11.cloudflarestream.com/${uid}/iframe?${autoplayParam}&preload=true&loop=true&poster=${thumbnail}`;
      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
    }
  }

  getCurrentSlideNumber(): number {
    return this.currentIndex + 1;
  }

  getTotalSlideCount(): number {
    return this.postService.post()!.PostMedia!.length;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.prevCarouselMedia();
    } else if (event.key === 'ArrowRight') {
      this.nextCarouselMedia();
    } else if (event.key === 'Escape') {
      if (this.dialogService.activeModal() === 'modalPost') {
        this.closeModal();
      }
    }
  }

  // constrols post
  // comments
  onCommentDialog(post: Post) {

    const user = this.authService.user()!;
    if (user.status === 'SUSPENDED') {
      this.toastService.start({ type: 'error', message: 'accountSuspended' });
      return;
    }

    this.postService.addPost(post);
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(CommentsPostComponent);
    componentRef.instance;
    this.dialogService.toggleModal('commentPost');
  }

  // dropdown
  closeModalDropdown() {
    //this.dialogService.closeModal();
    //const dataUpdate = {};
    //this.postService.latestPost(dataUpdate).subscribe();
  }

  onModalDropdown() {

    const user = this.authService.user()!;
    if (user.status === 'SUSPENDED') {
      this.toastService.start({ type: 'error', message: 'accountSuspended' });
      return;
    }

    this.dialogService.toggleModal('dropdownMenu');
  }

  //******** save bookmark */
  addPostBookmark(item: Post, value: any): void {
    this.dialogService.closeModal();
    if (this.authService.user()!) {
      const data = {
        Post: item._id,
      }
      this.bookmarkService.create(data).subscribe(res => {
        if (res) {
          this.toastService.start({ type: 'success', message: 'itWasSaved' });
        } else {
          //this.postBookmarkStatus = false;
        }
      });

    }
  }

  deleteBookmark(item: Post, value: any): void {
    this.dialogService.closeModal();
    if (this.authService.user()!) {
      const data = {
        Post: item._id,
      }

      this.bookmarkService.deleteUser(data).subscribe(res => {
        if (res) {
          this.toastService.start({ type: 'success', message: 'itWasDeleted' });
        } else {
          //this.postBookmarkStatus = false;
        }
      });
    }
  }

  /** pin to tops */
  onPinToTop(item: Post): void {

    const user = this.authService.user()!;
    if (user.status === 'SUSPENDED') {
      this.toastService.start({ type: 'error', message: 'accountSuspended' });
      return;
    }
    if (this.authService.user()!?._id === item.User?._id) {
      const data = {
        pined: item.pined == true ? false : true,
      };
      this.dialogService.closeModal();
      this.postService.updatePined(item._id!, data).subscribe(res => {

        const poToUpdatePosts = this.postService.posts().find((item) => item._id === this.postService.post()?._id);
        if (poToUpdatePosts) {
          this.postService.updatePosts(this.postService.post()!._id!, {
            pined: item.pined == true ? false : true,
          });
        }

        const poToUpdatePostsUser = this.postService.postsUser().find((item) => item._id === this.postService.post()?._id);
        if (poToUpdatePostsUser) {

          if (item.pined === false) {
            this.postService.removePostsUser(this.postService.post()?._id!);
            const currentPostsUser = this.postService.postsUser();
            const updatedPostsUser = [poToUpdatePostsUser, ...currentPostsUser];
            this.postService.addPostsUser(updatedPostsUser);
          }

          this.postService.updatePostsUser(this.postService.post()!._id!, {
            pined: item.pined == true ? false : true,
          });
        }

      });
    }
  }

  copyText(post: Post) {
    this.dialogService.closeModal();

    const textToCopy = `https://${environment.domain}/pu/` + post.slug;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.toastService.start({ type: 'success', message: 'copied_link' });
      console.log('El texto ha sido copiado al portapapeles');
    }, (err) => {
      console.error('Error al copiar el texto al portapapeles: ', err);
    });

  }

  onEdit(post: Post): void {
    this.dialogService.closeModal();
    this.dialogService.closeModal();
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(CreatePostComponent);
    componentRef.instance;

    this.dialogService.toggleModal('createPost');
    this.postService.addPost(post);
  }

  share(post: Post) {
    this.dialogService.closeModal();
    if (navigator.share) {
      navigator.share({
        title: post.description !== null ? post.description : `I'm hot, fuck me 👉👌😋`,
        text: `I want to have sex with you, soft and hard 👉👌😋`,
        url: `https://${environment.domain}/pu/` + post.slug
      })
        .then(() => console.log('Content shared successfully'))
        .catch((error) => console.log('Error al share:', error));
    } else {
      console.log('The Web Share API is not available in this browser');
    }
  }

  onDeleteDialog(post: Post): void {
    this.dialogService.closeModal();
    this.dialogService.toggleModal('deletePost');
  }

  onDelete(event: Event): void {
    event.preventDefault();

    this.dialogService.closeModal();
    this.spinnerService.start();
    const sub = this.postService.delete(this.postService.post()!._id).subscribe({
      next: (res) => {
        if (res) {
          this.postService.removePosts(this.postService.post()?._id!);
          this.postService.removePostsUser(this.postService.post()?._id!);
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'deletedSuccessfully' });
        }
      },
      error: (err) => {
        this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
        console.error('Error deleting', err);
        this.spinnerService.close();
      }
    });
  }

  // tip
  onTipDialog(post: Post) {
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(TipComponent);
    componentRef.instance;

    this.dialogService.toggleModal('tip');

    const dataTip = {
      type: 'TIP',
      typeContent: 'POST',
      post: post,
      user: post.User
    };
    this.tipService.addTip(dataTip);
  }

  // likes 
  onLikes(post: Post) {
    if (post && this.authService.user()!) {
      const data = {};

      // Encontrar el índice del objeto Post en la matriz
      const index = this.postService.posts().findIndex((item: Post) => item._id === post._id);

      // Si se encuentra el objeto en la matriz, actualizar el dato
      if (index !== -1) {
        //this.postService.posts()[index].likes! += 1;
        //this.postService.updatePosts(post._id!, 'likes', Number(this.postService.posts()[index].likes! + 1));
      }

      this.postService.likes(post._id!, data).subscribe(res => {
        if (res) {

        }
      });
    }
  }
}

