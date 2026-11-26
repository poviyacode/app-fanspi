import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-creator-onboarding',
  imports: [NgOptimizedImage,
    CommonModule,
    CustomTranslatePipe
  ],
  templateUrl: './creator-onboarding.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './creator-onboarding.component.scss'
})
export default class CreatorOnboardingComponent {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;


  // Usamos un Signal para el índice actual
  currentIndex = signal(0);
  private intervalId: any;

  onboardingSteps = [
    {
      title: 'onboarding1',
      image: 'public/logo/wallet.webp'
    },
    {
      title: 'onboarding2',
      image: 'public/logo/earth-image.webp'
    },
    {
      title: 'onboarding3',
      image: 'public/logo/money-flying-from-hand.webp'
    },
    {
      title: 'onboarding4',
      image: 'public/logo/bar-chart.webp'
    },
    {
      title: 'onboarding5',
      image: 'public/logo/pie-chart.webp'
    },
    {
      title: 'onboarding6',
      image: 'public/logo/checkmark.webp'
    }
  ];

  private router = inject(Router);

  ngOnInit() {
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.intervalId = setInterval(() => {
      const nextIndex = (this.currentIndex() + 1) % this.onboardingSteps.length;
      this.scrollTo(nextIndex);
    }, 8000); // Cambia cada 8 segundos
  }

  stopAutoPlay() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // Detectar el scroll para actualizar los puntos (dots)
  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const index = Math.round(element.scrollLeft / element.clientWidth);
    if (this.currentIndex() !== index) {
      this.currentIndex.set(index);
    }
  }

  // Navegar al siguiente slide o al anterior
  scrollTo(index: number) {
    const element = this.scrollContainer.nativeElement;
    element.scrollTo({
      left: index * element.clientWidth,
      behavior: 'smooth'
    });
  }

  next() {
    if (this.currentIndex() < this.onboardingSteps.length - 1) {
      this.scrollTo(this.currentIndex() + 1);
    } else {
      console.log('Finalizar Onboarding');
    }
  }

  start() {
    this.router.navigate(['/admin/personal']);
  }
}
