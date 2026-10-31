import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: 'root'
})

export class DialogService {

   public activeModal = signal<string | null>(null);
   public activePost = signal<string | null>(null);

   toggleModal(modalName: string | null) {
     this.closeModal();
     this.activeModal.set(modalName);
   }
 
   closeModal() {
     this.activeModal.set(null);
   }

   togglePost(modalName: string | null) {
    this.closePost();
    this.activePost.set(modalName);
  }

  closePost() {
    this.activePost.set(null);
  }
}
