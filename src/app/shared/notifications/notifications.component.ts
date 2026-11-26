import { Component, effect, EventEmitter, inject, OnInit, Output, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { PushNotificationService } from '@services/push-notification/push-notitication.service';
import { CommonModule, isPlatformBrowser, isPlatformServer, NgOptimizedImage } from '@angular/common';
import { NotificationService } from '@services/notification.service';
import { IconDirective } from '@directive/coin-svg.directive';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-notifications',
  imports: [
    CommonModule,
    IconDirective,
    DateAgoPipe,
    CustomTranslatePipe
  ],

  templateUrl: './notifications.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './notifications.component.scss'
})
export default class NotificationsComponent {

  @Output() closeModal = new EventEmitter<void>();
  private notificationService = inject(NotificationService);

  notifications = this.notificationService.getNotifications();

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
    this.closeModal.emit();
  }

  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
}

