import { FormGroup } from "@angular/forms";
import { PaymentOrder } from "@interfaces/paymentOrder";
import { User } from "@interfaces/user";


export class Tools {

  static innerTextIcon(text: any) {
    const url = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const hashTags = /(^|\s)(#[a-z\d-]+)/ig;
    const mentions = /(^|\s)@([a-z\d-]+)/ig;

    text = text.replace(hashTags, (match: any, p1: any, p2: any) => {
      return `${p1}<a class='text-blue-700 dark:text-blue-300 font-normal space-x-1 hover:underline' href='/tags/${p2}'>#${p2}</a>`;
    });

    text = text.replace(url, (match: any, p1: any) => {
      if (p1.length > 25) {
        return `<a class='text-blue-700 dark:text-blue-300 font-normal space-x-1 hover:underline' href='${p1}' target='_blank'><i class='fa-solid fa-link text-zinc-400 text-xs'></i> ${this.cropText(p1, 25)}...</a>`;
      } else {
        return `<a class='text-blue-700 dark:text-blue-300 font-normal space-x-1 hover:underline' href='${p1}' target='_blank'><i class='fa-solid fa-link text-zinc-400 text-xs'></i> ${p1}</a>`;
      }
    });

    text = text.replace(mentions, (match: any, p1: any, p2: any) => {
      return `${p1}<a class='text-primary-500 dark:text-primary-500 font-semibold space-x-1 hover:underline' href='/${p2}'>@${p2}</a>`;
    });

    text = text.replace(/(?:\r\n|\r|\n)/g, "<br>");

    return text;
  }

  static cropText(text: string, limit: number) {
    let res = text.slice(0, limit);
    return res;
  }

  static innerText(text: any) {
    const url = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const hashTags = /(^|\s)#([a-z\d-]+)/ig;
    const mentions = /(^|\s)@([a-z\d-]+)/ig;

    text = text.replace(hashTags, (match: any, p1: any, p2: any) => {
      return `${p1}<a class='text-blue-700 dark:text-blue-300 font-normal space-x-1 hover:underline' href='/tags/${p2}'>#${p2}</a>`;
    });

    text = text.replace(url, (match: any, p1: any) => {
      if (p1.length > 25) {
        return `<a class='text-blue-700 dark:text-blue-300 font-normal space-x-1 hover:underline' href='${p1}' target='_blank'>${this.cropText(p1, 25)}...</a>`;
      } else {
        return `<a class='text-blue-700 dark:text-blue-300 font-normal space-x-1 hover:underline' href='${p1}' target='_blank'>${p1}</a>`;
      }
    });

    text = text.replace(mentions, (match: any, p1: any, p2: any) => {
      return `${p1}<a class='text-primary-500 dark:text-primary-500 font-semibold space-x-1 hover:underline' href='/${p2}'>@${p2}</a>`;
    });

    text = text.replace(/(?:\r\n|\r|\n)/g, "<br>");

    return text;
  }

  static textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return {
      ...this.inputClass(formGroup, controlName),
      [height]: true
    };
  }


  static innerTextChat(text: any) {
    const url = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const hashTags = /(^|\s)(#[a-z\d-]+)/ig;
    const mentions = /(^|\s)@([a-z\d-]+)/ig;
    //text = text.replace(hashTags, "<a class='' href='/tag/$2'> $2 </a>");

    text = text.replace(url, (match: any, p1: any) => {
      if (p1.length > 25) {
        return `<a class=' font-normal space-x-1 underline' href='${p1}' target='_blank'>${this.cropText(p1, 25)}...</a>`;
      } else {
        return `<a class=' font-normal space-x-1 underline' href='${p1}' target='_blank'>${p1}</a>`;
      }
    });

    text = text.replace(mentions, (match: any, p1: any, p2: any) => {
      return `${p1}<a class='text-primary-500 dark:text-primary-500 font-semibold space-x-1 hover:underline' href='/${p2}'>@${p2}</a>`;
    });

    text = text.replace(/(?:\r\n|\r|\n)/g, "<br>");

    return text;
  }

  static inputClass(formGroup: FormGroup, controlName: string) {
    const control = formGroup.controls[controlName];

    return {
      'border-green-500 dark:border-green-500 focus:ring-green-100 active:ring-green-100':
        control.valid && (control.dirty || control.touched),

      'border-red-500 dark:border-red-500 focus:ring-red-100 active:ring-red-100':
        control.invalid && (control.dirty || control.touched),

      'w-full py-2 px-2 focus:outline-none focus:ring bg-zinc-100/40 dark:bg-zinc-800/90 rounded-md border border-gray-400/50 dark:border-gray-500/10 focus:ring-zinc-200 active:ring-zinc-200 focus:dark:ring-zinc-700 active:dark:ring-zinc-700 focus:border-blue-500 dark:focus:border-blue-500':
        true,
    };
  }

  static cardClass(): string {
    return 'rounded-3xl border-0 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.6)] transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1.1)] cursor-pointer';
  }

  static modalClass(): string {
    // Cambiamos 'w-full' por 'w-[calc(100%-2rem)]' para dejar un margen de 1rem (16px) a cada lado en móviles
    return 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-xl rounded-[28px] bg-white dark:bg-zinc-900 p-0 shadow-[0_11px_15px_-7px_rgba(0,0,0,0.1),0_24px_38px_3px_rgba(0,0,0,0.05),0_9px_46px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_11px_15px_-7px_rgba(0,0,0,0.5),0_24px_38px_3px_rgba(0,0,0,0.3)] transform transition-all duration-200 backdrop:fixed backdrop:inset-0 backdrop:bg-black/20 backdrop:dark:bg-black/40 backdrop:backdrop-blur-[2px] overflow-hidden';
  }

  static buttonClass() {
    return {
      'relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-zinc-900 dark:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium tracking-wide shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] active:shadow-none transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1.1)] active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none overflow-hidden': true,
    };
  }

  static buttonPrimaryClass() {
    return {
      'relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium tracking-wide shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-primary-600 active:shadow-none transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1.1)] active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none overflow-hidden': true,
    };
  }

  static buttonSecondaryClass() {
    return {
      'relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-transparent text-zinc-900 dark:text-white text-sm font-medium tracking-wide hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1.1)] active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none overflow-hidden': true,
    };
  }

  static buttonClassForm(isFormValid: boolean) {
    return {
      'relative inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-white text-base font-medium tracking-wide transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.4,1.1)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] active:shadow-none': true,
      'bg-primary-500 hover:bg-primary-600 active:scale-[0.97]': isFormValid,
      'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-50 pointer-events-none': !isFormValid
    };
  }

  // Clases adicionales para componentes Material
  static fabClass() {
    return 'inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-500 text-white shadow-[0_3px_5px_-1px_rgba(0,0,0,0.2),0_6px_10px_0_rgba(0,0,0,0.14),0_1px_18px_0_rgba(0,0,0,0.12)] hover:shadow-[0_5px_8px_-2px_rgba(0,0,0,0.2),0_8px_12px_1px_rgba(0,0,0,0.14),0_3px_16px_2px_rgba(0,0,0,0.12)] hover:bg-primary-600 active:shadow-[0_7px_10px_-3px_rgba(0,0,0,0.2),0_9px_13px_1px_rgba(0,0,0,0.14),0_4px_18px_3px_rgba(0,0,0,0.12)] transition-all duration-200 active:scale-95';
  }

  static labelClass() {
    return 'absolute left-0 -top-6 text-sm text-zinc-500 dark:text-zinc-400 transition-all duration-200 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:top-3 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-primary-500 pointer-events-none';
  }

  static chipClass() {
    return 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 cursor-pointer';
  }

  static dividerClass() {
    return 'h-px bg-zinc-200 dark:bg-zinc-800 my-4';
  }

  static listItemClass() {
    return 'flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-150 cursor-pointer';
  }

  static switchClass() {
    return {
      'relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2': true,
      'bg-primary-500': true
    };
  }

  static switchThumbClass() {
    return 'pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-200 translate-x-0 rtl:translate-x-0';
  }
}
