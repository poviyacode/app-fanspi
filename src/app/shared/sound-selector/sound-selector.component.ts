import { Component, effect, EventEmitter, inject, Output, signal } from '@angular/core';
import { DialogService } from '@services/dialog.service';
import { SoundService } from '@services/sound.service';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UIStyles } from '@core/common/uistyles';
import { SocketService } from '@services/socket.service';
import { Sound } from '@interfaces/sound';

@Component({
  selector: 'app-sound-selector',
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './sound-selector.component.html',
  styleUrl: './sound-selector.component.scss',
})
export default class SoundSelectorComponent {

  limitPage = 25;
  currentPage = 0;
  totalPages: number = 0;
  hasMore: boolean = true;
  isLoading = signal<boolean>(false);
  sounds = signal<any[]>([]);

  targetUserId!: string;
  public className = UIStyles;

  @Output() closeModal = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private soundService = inject(SoundService);
  public dialogService = inject(DialogService);
  private socketService = inject(SocketService);

  constructor() {
    effect(() => {

    });
  }
  ngOnInit(): void {
    this.findAllUser();
  }

  findAllUser() {
    const data = {};
    this.soundService.findAllUser(data, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          console.log(res)
          this.sounds.set(res.data);
          this.totalPages = res.totalPages;
          this.currentPage = res.currentPage;
          this.hasMore = res.hasMore;
        },
        error: (err) => {
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
          console.log('Request completed');
        }
      });
  }

  sendSound(sound: Sound) {
    if (!this.targetUserId) return;

    // Emitir evento al backend
    this.socketService.socket.emit('play_sound_to_user', {
      targetUserId: this.targetUserId,
      soundUrl: sound.url,
      soundName: sound.name
    });

    console.log(`✅ Sonido "${sound.name}" enviado al usuario ${this.targetUserId}`);
  }

  // close
  onCloseModal() {
    this.closeModal.emit(); // Notifica al padre que el modal se cerró
  }
}
