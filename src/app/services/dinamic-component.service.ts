import { BehaviorSubject } from 'rxjs';
import { Service } from '@angular/core';

@Service()
export class DynamicComponentService {
  private componentVisibleSubject = new BehaviorSubject<boolean>(false);
  componentVisible$ = this.componentVisibleSubject.asObservable();

  showComponent() {
    this.componentVisibleSubject.next(true);
  }

  hideComponent() {
    this.componentVisibleSubject.next(false);
  }
}
