import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
    selector: 'app-post-dialog',
    imports: [],
    templateUrl: './post-dialog.component.html',
    styleUrls: ['./post-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    animations: [
        trigger('fade', [
            state('void', style({ opacity: 0 })),
            state('*', style({ opacity: 1 })),
            transition(':enter', animate('300ms ease-in-out')),
            transition(':leave', animate('300ms ease-in-out')),
        ]),
    ]
})
export class PostDialogComponent implements OnInit {

  @Input() id: string;
  @Output() onClose = new EventEmitter<void>();

  private element: any;
  modalState = '';

  constructor(private el: ElementRef) {
    //this.element = el.nativeElement;
   }

  ngOnInit(): void {

    // if (!this.id) {
    //   console.error('modal must have an id');
    //   return;
    // }

    // // move element to bottom of page (just before </body>) so it can be displayed above everything else
    // document.body.appendChild(this.element);

    this.openModal();
  }

  closeModal() {
    this.modalState = 'void';
    setTimeout(() => {
      this.onClose.emit();
    }, 300);
  }

  openModal() {
    this.modalState = 'show';
  }



}

