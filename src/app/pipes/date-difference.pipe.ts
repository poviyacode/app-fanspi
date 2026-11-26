import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dateDifference',
    standalone: true
})

export class DateDifferencePipe implements PipeTransform {
    transform(timestamp: number): string {
        const currentDate = new Date();
        const givenDate = new Date(timestamp);

        const timeDiff = givenDate.getTime() - currentDate.getTime();
        const daysDiff = Math.max(Math.floor(timeDiff / (1000 * 3600 * 24)), 0);

        return `${daysDiff}`;
    }
}
