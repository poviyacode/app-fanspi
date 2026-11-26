import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'calculateAge',
  standalone: true
})
export class CalculateAgePipe implements PipeTransform {
  transform(birthYear: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return age < 18 ? 18 : age; // Si la edad es menor a 18, devuelve 18
  }
}
