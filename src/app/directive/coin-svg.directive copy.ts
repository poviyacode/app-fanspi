import { Directive, ElementRef, Input, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appCoinSvg]'
})
export class CoinSvgDirective implements OnInit {
  @Input() size: string = 'w-8 h-8';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="fill-current ${this.size}">
        <defs>
          <radialGradient id="coinGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color: #ffdd7a;" />
            <stop offset="100%" style="stop-color: #d4af37;" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" stroke="gold" stroke-width="4" fill="url(#coinGradient)" />
        <circle cx="50" cy="50" r="40" fill="orange" />
        <text x="50%" y="50%" text-anchor="middle" fill="white" dy=".3em" class="text-5xl font-bold">
          ⍴
        </text>
      </svg>
    `;
    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', svg);
  }
}
