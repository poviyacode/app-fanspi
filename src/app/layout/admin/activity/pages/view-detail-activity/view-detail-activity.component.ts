import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { TransactionCredit } from '@interfaces/transactionCredit';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import { IconDirective } from '@directive/coin-svg.directive';
import { AuthService } from '@services/auth.service';
import { UIStyles } from '@core/common/uistyles';
import { Router, RouterModule } from '@angular/router';
import { PostMediaDetails } from '@interfaces/postMedia';
import { ToolsService } from '@services/tools.service';
import { PostMediaService } from '@services/post-media.service';
import { takeUntil } from 'rxjs';
import { PaymentOrder } from '@interfaces/paymentOrder';

@Component({
  selector: 'app-view-detail-activity',
  imports: [
    CommonModule,
    CustomTranslatePipe,
    DateAgoPipe,
    IconDirective,
    RouterModule,
  ],
  templateUrl: './view-detail-activity.component.html',
  styleUrl: './view-detail-activity.component.scss',
})
export default class ViewDetailActivityComponent {

  public className = UIStyles;

  @Input() item: TransactionCredit | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() cancelOrderP2p = new EventEmitter<TransactionCredit>();

  public authService = inject(AuthService);
  private toolsService = inject(ToolsService);
  private postMediaService = inject(PostMediaService);
  public router = inject(Router);

  onClose() {
    this.close.emit();
  }

  onCancelOrderP2p(item: TransactionCredit) {
    this.cancelOrderP2p.emit(item); // 👈 Emitimos el evento hacia el padre
  }

  // chat 
  async onChat(paymentOrder: PaymentOrder) {
    this.router.navigate(['/chats/messages', String(paymentOrder.gatewayDetails.Chat)]);
  }

  getFirstLetter(name: string): string { return this.toolsService.getFirstLetter(name); }
  getMediaDetails(item: any): PostMediaDetails | null { return this.postMediaService.getBackgroundImageUrl(item); }

}
