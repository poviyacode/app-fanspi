import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, inject, Output, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { UIStyles } from '@core/common/uistyles';
import { IconDirective } from '@directive/coin-svg.directive';
import { Interaction } from '@interfaces/interaction';
import { User } from '@interfaces/user';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { AuthService } from '@services/auth.service';
import { ChatService } from '@services/chat.service';
import { InteractionService } from '@services/interaction.service';
import { KissService } from '@services/kiss.service';
import { MessageService } from '@services/message.service';
import { SocketService } from '@services/socket.service';
import { SpinnerService } from '@services/spinner.service';
import { ToastService } from '@services/toast.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-invite-banner',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    IconDirective
  ],
  templateUrl: './invite-banner.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './invite-banner.component.scss'
})
export default class InviteBannerComponent {

  @Output() closeModal = new EventEmitter<void>();
  private destroy$ = new Subject<void>();

  public className = UIStyles;
  //sound
  audio: HTMLAudioElement | null = null;

  private chatService = inject(ChatService);
  private spinnerService = inject(SpinnerService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private toastService = inject(ToastService);
  public router = inject(Router);
  private socketService = inject(SocketService);
  private kissService = inject(KissService);
  private transactionCreditService = inject(TransactionCreditService);

  private interactionService = inject(InteractionService);

  // signal user suggestions
  interactionUsers = this.interactionService.getUserSuggestions();

  async startInteraction(user: User, type: 'chat' | 'video') {

    this.interactionService.removeUserSuggestions(user._id!);

    if (type === 'chat') {
      await this.onChat(user!);
    }

    const data: any = {
      type: 'LIKE',
      Swiped: user._id,
    }
    await this.onCreate(data);
  }

  async removeUserSuggestion(user: User) {
    this.interactionService.removeUserSuggestions(user._id!);
    const data: any = {
      type: 'DISLIKE',
      Swiped: user._id,
    }
    //await this.onCreate(data);
  }

  // user image
  getProfileImageUrl(user: User): string {

    const userProfile = user!;
    if (!userProfile || !userProfile.Profile || userProfile.Profile.length === 0) {
      return '';
    }

    const profile = userProfile.Profile[0];
    if (profile.cloudflare && profile.cloudflare.result && profile.cloudflare.result.variants && profile.cloudflare.result.variants.length > 0) {
      return profile.cloudflare.result.variants[0];
    }
    return profile.url || '';
  }


  async onCreate(data: Interaction) {

    this.interactionService.create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {

        },
        error: (err) => {
          console.error('Errr init live:');
        },
        complete: () => {
          console.log('Request completed');
        }
      });
  }

  async onChat(item: User) {
    const data: { Sender: User, Receiver: User } = {
      Sender: this.authService.user()!,
      Receiver: item
    }
    await this.chatService.startChatWithProfile(data);
  }

  // close
  onCloseModal() {
    this.closeModal.emit(); // Notifica al padre que el modal se cerró
  }

  //  input class
  buttonClass() {
    return UIStyles.buttonClass();
  }
}
