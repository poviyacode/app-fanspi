import { Component, computed, effect, EventEmitter, inject, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '@services/toast.service';
import { AuthService } from '@services/auth.service';
import { CommentService } from '@services/comment.service';
import { Comments } from '@interfaces/comment';
import { Post } from '@interfaces/post';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { DialogService } from '@services/dialog.service';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { CommonModule } from '@angular/common';
import { UIStyles } from '@core/common/uistyles';
import { User } from '@interfaces/user';
import { PostService } from '@services/post.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { IconDirective } from '@directive/coin-svg.directive';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import { AutoResizeTextareaDirective } from '@directive/auto-resize-textarea.directive';
import { ToolsService } from '@services/tools.service';

@Component({
  selector: 'app-comments-post',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DateAgoPipe,
    IconDirective,
    AutoResizeTextareaDirective
  ],
  templateUrl: './comments-post.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './comments-post.component.scss'
})
export class CommentsPostComponent {

  commentMyform: FormGroup;

  commnetHasMore: boolean = false;
  commentLoading: boolean = false;
  commentTotalPages = 0;
  commentCurrentPage = 0;
  commentLimitPage = 10;

  dataSearchComment: any;
  commentDropdown: boolean = false;
  commentDropdownDelete: boolean = false;
  public className = UIStyles;

  private destroy$ = new Subject<void>();
  @Output() closeModal = new EventEmitter<void>();

  fb = inject(FormBuilder);
  toastService = inject(ToastService);
  authService = inject(AuthService);
  commentService = inject(CommentService);
  router = inject(Router);
  dialogService = inject(DialogService);
  postService = inject(PostService);
  private toolsService = inject(ToolsService);

  constructor() {
    this.commentService.resetComments();
    effect(() => {
      if (this.postService.post() && this.postService.post()!.commentCount! > 0) {
        this.findAllComments();
      }
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
    this.commentMyform = this.fb.group({
      text: ['', [Validators.required, Validators.maxLength(150)]]
    });
  }

  findAllComments(): void {
    this.commentLoading = true;
    const data = {
      Post: this.postService.post()?._id
    };

    this.commentService.findAllPost(data, this.commentLimitPage, this.commentCurrentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {

            if (this.commentCurrentPage === 0) {
              this.commentTotalPages = res.total;

              if (Number(this.postService.post()?.commentCount) !== Number(res.total)) {
                this.updatePostCommentCount(res.total);
              }
            }

            const currentCommnets = this.commentService.comments();
            const newPosts = res.data.filter((newPost: Post) => {
              return !currentCommnets.some(existing => existing._id === newPost._id);
            });
            const updatedComments = [...currentCommnets, ...newPosts];
            this.commentService.addComments(updatedComments);

            this.commnetHasMore = this.commentCurrentPage <= res.total;

          } else {
            this.commnetHasMore = false;
          }
          this.commentLoading = false;
        },
        error: (err) => {
          this.commnetHasMore = false;
          this.commentLoading = false;
        },
        complete: () => {
          console.log('Request completed');
        }
      });
  }

  onEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      event.preventDefault();
      const textarea = keyboardEvent.target as HTMLTextAreaElement;
      textarea.style.height = '2.25rem';
      this.onCommentSend();
    }
  }

  onCommentSend(): void {

    if (!this.authService.user()!) {
      this.router.navigateByUrl('auth/login');
      return;
    }

    if (this.commentMyform.valid && this.authService.user()!) {

      this.postService.post()!.commentCount = (this.postService.post()!.commentCount || 0) + 1;

      this.toastService.start({ type: 'success', message: 'wasPublished' });

      const commentUpdate: Comments = {
        _id: `${Date.now()}`,
        User: this.authService.user()!,
        Post: this.postService.post()!,
        text: this.commentMyform.value.text
      };

      const currentCommnets = this.commentService.comments();
      const updatedComments = [commentUpdate, ...currentCommnets,];
      this.commentService.addComments(updatedComments);

      const data = {
        Post: this.postService.post()?._id,
        text: this.commentMyform.value.text
      }

      this.commentMyform.patchValue({
        text: '',
      });

      this.commentService.create(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.commentService.updateComments(commentUpdate._id!, {
              _id: res._id
            })
          }
        })
    }
  }

  onCommentDeleteDialog(id: string): void {
    if (this.authService.user()!) {

      this.commentService.removeComments(id);
      this.postService.post()!.commentCount = (this.postService.post()!.commentCount || 0) - 1;

      this.commentService.delete(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
          },
          error: (err) => {

          },
          complete: () => {
            console.log('Request completed');
          }
        })
    }
  }

  innerText(text: any) {
    return UIStyles.innerText(text);
  }

  onCommentDropdown(comment: Comments) {
    if (this.authService.user()!) {
      this.commentDropdown = false;

      if (this.authService.user()!._id) {
        this.commentDropdownDelete = true;
      }
      else if (comment.User?._id == this.authService.user()!._id) {
        this.commentDropdownDelete = true;
      } else {
        this.commentDropdownDelete = false;
      }
      this.commentDropdown = true;
    }
  }

  incrementCommentCount(postId: string) {
    const currentPosts = this.postService.posts();

    const post = currentPosts.find(post => post._id === postId);
    if (post) {
      const newCount = post.commentCount! + 1;
      this.postService.updateCommentCount(postId, newCount);
    }
  }

  updatePostCommentCount(count: number) {

    const data = {
      commentCount: count
    }

    this.postService.updateField(this.postService.post()?._id!, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.postService.updatePosts(this.postService.post()?._id!, {
            commentCount: count
          });
          this.postService.post()!.commentCount = count;
        },
        error: (err) => {

        },
        complete: () => {
          console.log('Request completed');
        }
      });
  }

  // close
  onCloseModal() {
    this.closeModal.emit(); // Notifica al padre que el modal se cerró
  }

  cardModalClass() {
    return UIStyles.cardModalClass();
  }

  getFirstLetter(name: string): string {
    return this.toolsService.getFirstLetter(name);
  }

}

