import { Service, signal } from '@angular/core';

@Service()
export class KissService {
  // El signal que controlará la visibilidad del beso en toda la app.
  // Será 'true' si debe mostrarse, 'null' si debe ocultarse.
  public showKiss = signal<boolean | null>(null);

  private timeoutHandle: any;
  private readonly defaultDuration = 3000; // 3 segundos por defecto

  /**
   * Inicia la visualización del beso y establece un temporizador para ocultarlo.
   * @param duration Duración en milisegundos que el beso estará visible.
   */
  start(duration: number = this.defaultDuration): void {
    // 1. Limpiar cualquier temporizador pendiente para evitar que se ejecute dos veces
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }

    // 2. Mostrar el beso inmediatamente
    this.showKiss.set(true);

    // 3. Configurar el temporizador para ocultar el beso después de la duración especificada
    this.timeoutHandle = setTimeout(() => {
      this.showKiss.set(null); // Oculta el beso
    }, duration);
  }
}