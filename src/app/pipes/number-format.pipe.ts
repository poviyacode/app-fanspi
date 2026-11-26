import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'numberFormat'
})
export class NumberFormatPipe implements PipeTransform {
    transform(value: number): string {
        if (!value || value === 0) {
            return '0';
        }

        if (value < 1000) {
            return value.toString();
        }

        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const suffixIndex = Math.floor(('' + value).length / 3);

        let formattedValue: string | number = value;

        if (suffixIndex > 0) {
            formattedValue = (value / Math.pow(1000, suffixIndex)).toFixed(1);
            formattedValue += suffixes[suffixIndex];
        }

        return formattedValue.toString();
    }
}