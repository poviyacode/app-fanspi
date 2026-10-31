import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy, NgZone } from '@angular/core';
import { ToolsService } from '@services/tools.service';

@Pipe({
    name: 'dateAgoTime',
    pure: false,
    standalone: false
})
export class DateAgoTimePipe implements PipeTransform, OnDestroy {

  private lastUpdate: string;
  private timer: any;

  constructor(private toolsService: ToolsService, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  transform(value: any): any {
    if (!value) return value;

    this.clearTimer(); // Limpia cualquier intervalo existente
    this.updateValue(value); // Actualiza el valor la primera vez
    this.createTimer(value); // Crea un nuevo temporizador para actualizar el valor periódicamente

    return this.lastUpdate;
  }

  private updateValue(value: any) {
    const lang = this.toolsService.language();
    const seconds = Math.floor((+new Date() - +new Date(value)) / 1000);

    if (seconds < 29) {
      this.lastUpdate = 'now';
    } else {
      const intervals: { [key: string]: number } = {
        'year': 31536000,
        'month': 2592000,
        'week': 604800,
        'd': 86400,
        'h': 3600,
        'm': 60,
        's': 1
      };

      for (const i in intervals) {
        const counter = Math.floor(seconds / intervals[i]);
        if (counter > 0) {
          if (i === 'week' || i === 'month' || i === 'year') {
            const date = new Date(value);
            const dateFormatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
            if (new Date().getFullYear() !== date.getFullYear()) {
              dateFormatOptions.year = 'numeric';
            }
            this.lastUpdate = date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', dateFormatOptions);
          } else {
            this.lastUpdate = counter + i;
          }
          break;
        }
      }
    }

    this.cdr.markForCheck();
  }

  private createTimer(value: any) {
    this.ngZone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        this.ngZone.run(() => {
          this.updateValue(value);
        });
      }, 60000); // Actualiza cada minuto
    });
  }

  private clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }
}
