import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberMoney',
  pure: true,
  standalone: true
})
export class NumberMoneyPipe implements PipeTransform {
    transform(value: any, ...args: any[]) {
      if(value)
        {
          return Number(value.toFixed(2));
        }
        else {
          return '0.00';
        }
        
    }

}