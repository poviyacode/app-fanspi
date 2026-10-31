import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ChangeDetectionStrategy, signal, ComponentFactoryResolver  } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  animations: [
    trigger('menuAnimation', [
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(-10px)'
      })),
      transition('visible => hidden', animate('0.1s ease')),
      transition('hidden => visible', animate('0.1s ease'))
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent {

  showMenu = signal(false);

  @Input() position: any;
  @Output() OnChange: EventEmitter<string> = new EventEmitter<string>();

  constructor(private elementRef: ElementRef) {}

  toggleMenu() {
    this.showMenu.set(!this.showMenu());
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showMenu.set(false);
    }
  }

}
