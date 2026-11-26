import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {

  transform(value: string, limit?: number): string {
    if (!value) return '';
    let actualLimit = limit ? limit : 10; // Utiliza 10 como valor predeterminado si no se proporciona un límite
    return value.length > actualLimit ? value.substring(0, actualLimit) + '...' : value;
  }

}
