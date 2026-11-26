import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lowercase',
  pure: true
})
export class LowercasePipe implements PipeTransform {
  transform(value: string): string {
    console.log(value);
    return value.toLowerCase();
  }

}