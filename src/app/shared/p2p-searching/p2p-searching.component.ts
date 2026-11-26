import { Component, EventEmitter, Output, inject, effect, signal, computed, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { PaymentOrderService } from '@services/payment-order.service';
import { PaymentOrder } from '@interfaces/paymentOrder';

@Component({
  selector: 'app-p2p-searching',
  standalone: true,
  imports: [CommonModule, CustomTranslatePipe],
  templateUrl: './p2p-searching.component.html'
})
export default class P2pSearchingComponent implements OnInit, OnDestroy {
  totalPrice: string | number = '';
  currency: string = '';
  paymentOrder = signal<PaymentOrder | null>(null);

  // 1. Usamos signal para el tiempo restante
  timeLeft = signal(1800); // 1800 segundos = 30 minutos

  // 2. Usamos computed para formatear el tiempo automáticamente cuando timeLeft cambia
  formattedTime = computed(() => {
    const totalSeconds = this.timeLeft();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  private timerInterval: any;

  @Output() closeModal = new EventEmitter<void>();
  public paymentOrderService = inject(PaymentOrderService);

  constructor() {
    effect(() => {
      const order = this.paymentOrderService.paymentOrder();
      if (order) {
        this.totalPrice = order.amount!;
        this.paymentOrder.set(order);
      }
    });
  }

  ngOnInit() {
    this.startCountdown();
  }

  startCountdown() {
    // Limpiamos cualquier intervalo previo por seguridad
    this.stopTimer();

    // Al actualizar una señal, Angular detecta el cambio automáticamente, no necesitamos NgZone
    this.timerInterval = setInterval(() => {
      const current = this.timeLeft();
      if (current > 0) {
        this.timeLeft.set(current - 1);
      } else {
        this.onTimeOut();
      }
    }, 1000);
  }

  onTimeOut() {
    this.stopTimer();
    this.closeModal.emit();
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

}