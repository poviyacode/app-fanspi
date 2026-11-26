import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'domain'
})
export class DomainPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return '';
    }

    // Parse the URL to extract the domain
    const url = new URL(value);
    return url.hostname;
  }
}
