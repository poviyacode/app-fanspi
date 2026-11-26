import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[appAutoResizeTextarea]',
  standalone: true
})
export class AutoResizeTextareaDirective {

  private el = inject(ElementRef);

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    this.adjustTextareaHeight(event.target as HTMLTextAreaElement);
  }

  ngAfterViewInit(): void {
    this.adjustTextareaHeight(this.el.nativeElement);
  }

  private adjustTextareaHeight(textarea: HTMLTextAreaElement): void {
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';
    textarea.style.height = '2.25rem';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

}
