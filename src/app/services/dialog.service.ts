import { signal, Service } from "@angular/core";
export type ModalType = 'creditPurchase' | 'inviteBanner' | 'notification' | 'modalRequestJoinCall';

@Service()
export class DialogService {

  public activeModal = signal<string | null>(null);
  public activeModal$ = this.activeModal.asReadonly();

  // Quitamos el '!' peligroso y manejamos el fallback de forma segura
  toggleModal(modalName?: string | null) {
    if (modalName) {
      this.activeModal.set(modalName);
    } else {
      this.closeModal();
    }
  }

  closeModal() {
    this.activeModal.set(null);
  }

}
