import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'isNew',
    standalone: true
})
export class IsNewPipe implements PipeTransform {
    transform(value: string | Date | undefined, days: number = 90): boolean {
        if (!value) return false;

        const createdAt = new Date(value);
        const now = new Date();

        // Calculamos la diferencia en milisegundos
        const diffInMs = now.getTime() - createdAt.getTime();

        // Convertimos los días parametrizados a milisegundos
        // (1000ms * 60s * 60m * 24h * cantidad de días)
        const limitInMs = 1000 * 60 * 60 * 24 * days;

        // Si la diferencia es menor al límite y no es una fecha futura
        return diffInMs > 0 && diffInMs < limitInMs;
    }
}