import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thousands',
  standalone: true
})
export class ThousandsPipe implements PipeTransform {
  transform(value: number): string {

    if (value >= 1000) {
      const suffixes = ['', 'k', 'M', 'B', 'T'];
      const suffixNum = Math.floor(('' + value).length / 3);
      let shortValue: any = parseFloat((suffixNum !== 0 ? (value / Math.pow(1000, suffixNum)) : value).toPrecision(2));
      if (shortValue % 1 !== 0) {
        shortValue = shortValue.toFixed(1);
      }
      return shortValue + suffixes[suffixNum];
    }
    return value.toString();
  }
}
