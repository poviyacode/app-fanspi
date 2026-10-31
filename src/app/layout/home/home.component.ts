import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Tools } from '@core/common/tools';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterModule,
    CustomTranslatePipe
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.component.scss'
})
export default class HomeComponent {

  // ssr
  isBrowser: boolean;
  isServer: boolean;

  isMobileMenuOpen = false;

  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      // Agrega un console.log aquí para debuguear:
      const elements = document.querySelectorAll('.animate-hidden');
      console.log('Elementos encontrados:', elements.length); // Si dice 0, el HTML no tiene la clase

      elements.forEach((el) => observer.observe(el));
    }
  }

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;

    // Opcional: Bloquear el scroll de la página cuando el menú está abierto
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  // button class
  buttonPrimaryClass() {
    return Tools.buttonPrimaryClass();
  }

  buttonSecondaryClass() {
    return Tools.buttonSecondaryClass();
  }

  buttonClass() {
    return Tools.buttonClass();
  }

  buttonClassForm(formGroup: boolean) {
    return Tools.buttonClassForm(formGroup);
  }
}
