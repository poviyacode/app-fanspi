import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
    name: 'dateAgo',
    standalone: true,
    pure: false // <-- 1. Importante: Cambiar a impuro para que detecte cambios de idioma o reintentos
})
export class DateAgoPipe implements PipeTransform {
    constructor(private translate: TranslateService) { }

    transform(date: string | null | undefined): string {
        if (!date) return '';

        const pastDate = new Date(date);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

        if (diffInSeconds < 0) {
            return this.translate.instant('inTheFuture');
        }

        const intervals: { [key: string]: number } = {
            timeyear: 31536000,
            timemonth: 2592000,
            timeweek: 604800,
            timeday: 86400,
            timehour: 3600,
            timeminute: 60,
            timesecond: 1
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const value = Math.floor(diffInSeconds / secondsInUnit);
            if (value >= 1) {
                const key = value === 1 ? unit : `${unit}_plural`;
                const translation = this.translate.instant(key, { count: value });

                // Si ngx-translate devuelve la misma clave, significa que aún no cargó el JSON
                if (translation === key) {
                    return ''; // O un texto de carga provisional
                }

                return translation;
            }
        }

        const fallback = this.translate.instant('justNow');
        return fallback === 'justNow' ? '' : fallback;
    }
}