import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule, Location, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, effect, inject, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Post } from '@interfaces/post';
import { ToastService } from '@services/toast.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { BookmarkService } from '@services/bookmark.service';
import { DialogService } from '@services/dialog.service';
import { DynamicComponentService } from '@services/dinamic-component.service';
import { PostService } from '@services/post.service';
import { ModalPostComponent } from '../modal-post/modal-post.component';
import CreatePostComponent from '@layout/admin/create/create-post/create-post.component';
import { SpinnerService } from '@services/spinner.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { environment } from '@environments/environment';
import { UIStyles } from '@core/common/uistyles';

@Component({
  selector: 'app-dropdown-post',
  imports: [
    CommonModule,
    CustomTranslatePipe
  ],
  templateUrl: './dropdown-post.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dropdown-post.component.scss'
})
export class DropdownPostComponent {

  private destroy$ = new Subject<void>();

  private location = inject(Location);
  dialogService = inject(DialogService);
  postService = inject(PostService);
  toastService = inject(ToastService);
  authService = inject(AuthService);
  dynamicComponentService = inject(DynamicComponentService);
  router = inject(Router);
  bookmarkService = inject(BookmarkService);
  spinnerService = inject(SpinnerService);

  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;

  constructor() {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.dialogService.closeModal();
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
    this.router.navigateByUrl(this.postService.post()!.User?.username!);
    this.spinnerService.start();

    this.postService.delete(this.postService.post()!._id)
      .subscribe({
        next: (res) => {
          if (res) {
            this.postService.removePosts(this.postService.post()?._id!);
            this.postService.removePostsUser(this.postService.post()?._id!);
            this.postService.resetPost();
          }
        },
        error: (err) => {
          this.spinnerService.close();
          this.toastService.start({ type: 'error', message: 'somethingWentWrong' });
          console.error('Error deleting', err);
        },
        complete: () => {
          this.spinnerService.close();
          this.toastService.start({ type: 'success', message: 'deletedSuccessfully' });
        }
      });
  }

  // button class
  buttonClass() {
    return UIStyles.buttonClass();
  }
}
