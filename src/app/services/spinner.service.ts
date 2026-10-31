import { Injectable, signal } from '@angular/core';
import { Message } from '@interfaces/message';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  public spinner = signal(false);

  start() {
    this.spinner.set(true);
  }

  close() {
    this.spinner.set(false);
  }

}
