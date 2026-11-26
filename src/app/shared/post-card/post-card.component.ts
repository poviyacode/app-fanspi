import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { IconDirective } from '@directive/coin-svg.directive';
import { Post } from '@interfaces/post';
import { PostMediaDetails } from '@interfaces/postMedia';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { PostMediaService } from '@services/post-media.service';
import { PostService } from '@services/post.service';
import { ToolsService } from '@services/tools.service';
import { UserService } from '@services/user.service';
import { IsNewPipe } from "../../pipes/is-new.pipe";
import { NumberFormatPipe } from '@pipes/number-format.pipe';

@Component({
  selector: 'app-post-card',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    IconDirective,
    IsNewPipe,
    NumberFormatPipe
  ],
  templateUrl: './post-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './post-card.component.scss'
})
export default class PostCardComponent {

  item = input.required<Post>();
  showProfile = input<boolean>(true);
  showPined = input<boolean>(false);
  postClick = output<any>();
  imageLoaded = signal(false);

  private postMediaService = inject(PostMediaService);
  private toolsService = inject(ToolsService);
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private userService = inject(UserService);

  isPrivate = computed(() => {
    const post = this.item();
    if (!post) return false;

    const currentSubscriptionDate = post?.currentSubscriptionDate || 0;

    const expirationDate = this.userService.userProfile()?.Subscription?.expirationDate || 0;

    const daysDifference = this.postService.calculateDaysDifference(currentSubscriptionDate, expirationDate);

    let currentPrivate = false;

    if (post.typeView === 'FREE' || this.authService?.user()?._id === post?.User?._id) {
      currentPrivate = false;
    } else {

      if (Number(daysDifference) > 0) {
        currentPrivate = false;
      } else {
        currentPrivate = true;
      }
    }
    return currentPrivate;
  });

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/default-avatar.png'; // Imagen por defecto
    this.imageLoaded.set(true); // Oculta skeleton aunque falle
  }

  onPostClick() {
    this.postClick.emit(this.item());
  }

  // get first letter
  getFirstLetter(name: string): string {
    return this.toolsService.getFirstLetter(name);
  }

  // get media details
  getMediaDetails(item: any): PostMediaDetails | null {
    return this.postMediaService.getBackgroundImageUrl(item);
  }

  getUserStatusClass(user: any) {
    return {
      'ring-2 ring-[#ff0050] animate-pulse': user?.live,
      'ring-2 ring-green-500': user?.online && !user?.live,
      'ring-1 ring-white/30': !user?.online && !user?.live
    };
  }
}
