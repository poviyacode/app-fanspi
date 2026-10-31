import { Directive, ElementRef, Input, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appLazyLoadImage]'
})
export class LazyLoadImageDirective implements OnInit {
  @Input('appLazyLoadImage') src!: string; // URL de la imagen real
  @Input() placeholder!: string; // URL de la imagen de carga

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.setPlaceholder();
    this.loadImage();
  }

  private setPlaceholder() {
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholder);
  }

  private loadImage() {
    const img = new Image();
    img.src = this.src;
    img.onload = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.src);
    };
  }
}
