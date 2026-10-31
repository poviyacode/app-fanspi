import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appAutoResizeTextarea]'
})
export class AutoResizeTextareaDirective {

  constructor(private el: ElementRef) { }

  @HostListener('input', ['$event.target'])
  onInput(textarea: HTMLTextAreaElement): void {
    this.adjustTextareaHeight(textarea);
  }

  ngAfterViewInit(): void {
    // Ajusta la altura inicial después de que se renderice el componente
    this.adjustTextareaHeight(this.el.nativeElement);
  }

  private adjustTextareaHeight(textarea: HTMLTextAreaElement): void {
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';
    textarea.style.height = '2.25rem';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

}
