// import { ConfiguracionPersonasService } from './../../../servicios/configuracion-personas.service';
import { ValidationErrors, ValidatorFn, AbstractControl, FormGroup, FormControl, Validators } from '@angular/forms';

export function textNumberValidator(control: AbstractControl) {
  const value = control.value;
  if (!value) {
    return null; // No validation error if the field is empty
  }
  if (/^[0-9]*$/.test(value)) {
    return { onlyNumbers: true }; // Validation error if only contains numbers
  }
  return null; // Validation success if contains at least one non-numeric character
}

export function AgeValidator(
  control: AbstractControl
): { [key: string]: boolean } | null {
  if (control.value < 18 || control.value > 59) {
    return { age: true };
  }
  return null;
}

export function PricePostValidator(
  control: AbstractControl
): { [key: string]: boolean } | null {
  if (control.value < 1 || control.value > 99) {
    return { age: true };
  }
  return null;
}

// Number only validation
export function NumericValidator(control: AbstractControl) {
  let val = control.value;

  if (val === null || val === '') return null;

  if (!val.toString().match(/^[0-9]+(\.?[0-9]+)?$/)) return { 'invalidNumber': true };

  return null;
}

export function pricePrimary(control: AbstractControl) {
  let val = control.value;

  if (val === null || val === '') return null;

  if (val % 1 !== 0) {
    return { 'invalidNumber': true };
  }

  if (!val.toString().match(/^[0-9]+(\.?[0-9]+)?$/)) return { 'invalidNumber': true };

  if (Number(val) === 0) {
    return null
  } else if (val < 10 || val > 500) {
    return { 'invalidNumber': true };
  } else {
    return null;
  }
}

export function buyCredit(control: AbstractControl) {
  let val = control.value;

  if (val % 1 !== 0) {
    return { 'invalidNumber': true };
  }

  if (val === null || val === '') return null;

  if (!val.toString().match(/^[0-9]+(\.?[0-9]+)?$/)) return { 'invalidNumber': true };

  if (val < 10) return { 'InvalidNumber': true }
  if (val == 0) return { 'InvalidNumber': true }
  if (val > 500) return { 'InvalidNumber': true }
  return null;
}

export function NumeriDiscount(control: AbstractControl) {
  let val = control.value;

  if (val === null || val === '') return null;

  if (!val.toString().match(/^[0-9]+(\.?[0-9]+)?$/)) return { 'invalidNumber': true };

  if (val < 0 && val > 99) return { 'InvalidNumber': true }
  return null;
}

export function NumericValidatorTip(control: AbstractControl) {
  let val = control.value;

  if (val === null || val === '') return null;

  if (val % 1 !== 0) {
    return { 'invalidNumber': true };
  }

  if (!val.toString().match(/^[0-9]+(\.?[0-9]+)?$/)) return { 'invalidNumber': true };

  if (isNaN(val) || val < 1 || val > 500) {
    return { 'invalidNumber': true };
  }

  return null;
}

export function MatchValidator(source: string, target: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const sourceCtrl = control.get(source);
    const targetCtrl = control.get(target);
    console.log(sourceCtrl)
    return sourceCtrl && targetCtrl && sourceCtrl.value !== targetCtrl.value
      ? { mismatch: true }
      : null;
  };
}

export function MatchCurrentPasswordValidator(currentPassword: string): ValidatorFn {
  return (control: AbstractControl): { [key: string]: boolean } | null => {
    const enteredPassword = control.value;

    if (enteredPassword && enteredPassword !== currentPassword) {
      return { passwordMismatch: true };
    }
    return null;
  };
}

export function ConfirmPasswordValidator(password: string, confirmPassword: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const formGroup = control as FormGroup;
    const pass = formGroup.get(password)?.value;
    const confirmPass = formGroup.get(confirmPassword)?.value;

    return pass === confirmPass ? null : { passwordsMismatch: true };
  };
}

// export function ConfirmPasswordValidator(controlName: string, matchingControlName: string) {
//   return (formGroup: FormGroup) => {
//     let control = formGroup.controls[controlName];
//     let matchingControl = formGroup.controls[matchingControlName]
//     if (
//       matchingControl.errors &&
//       !matchingControl.errors['confirmPasswordValidator']
//     ) {
//       return;
//     }
//     if (control.value !== matchingControl.value) {
//       matchingControl.setErrors({ confirmPasswordValidator: true });
//     } else {
//       matchingControl.setErrors(null);
//     }
//   };
// }

export function UrlValidator(control: AbstractControl): ValidationErrors | null {
  let str = control.value;
  if (!str)
    return { 'invalidUrl': true };
  if (!str.toString().match(/^https:\/*(?:\w+(?::\w+)?@)?[^\s\/]+(?::\d+)?(?:\/[\w#!:.?+=&%@\-\/]*)?$/)) return { 'invalidUrl': true };
  return null;
}

export function fileTypeValidator(control: AbstractControl): Promise<ValidationErrors | null> {
  return new Promise((resolve) => {
    const file = control.value;

    if (!file) {
      resolve(null);
    } else {
      const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'mkv', 'webm'];
      const extension = file.split('.').pop()?.toLowerCase();

      if (!extension || !allowedExtensions.includes(extension)) {
        resolve({ invalidFileType: true });
      } else {
        resolve(null);
      }
    }
  });
}

export function fileTypeImageValidator(control: AbstractControl): Promise<ValidationErrors | null> {
  return new Promise((resolve) => {
    const file = control.value;

    if (!file) {
      resolve(null);
    } else {
      const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'avif', 'webp'];
      const extension = file.split('.').pop()?.toLowerCase();

      if (!extension || !allowedExtensions.includes(extension)) {
        resolve({ invalidFileType: true });
      } else {
        resolve(null);
      }
    }
  });
}

export function validatePhoneRequired(control: AbstractControl): ValidationErrors | null {
  const typeControl = control.parent?.get('type');

  if (typeControl && typeControl.value === 'WhatsApp') {
    // Si el tipo es WhatsApp, se requiere el número de teléfono
    return Validators.required(control);
  }

  // Si el tipo no es WhatsApp, el número de teléfono no es requerido
  return null;
}

export function validateUsernameRequired(control: AbstractControl): ValidationErrors | null {
  const typeControl = control.parent?.get('type');
  console.log(typeControl?.value);
  if (typeControl && typeControl.value === 'WhatsApp') {
    // Si el tipo es WhatsApp, no se requiere el nombre de usuario
    return null;
  }

  // Si el tipo no es WhatsApp, se requiere el nombre de usuario
  return Validators.required(control);
}

export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // La expresión regular para validar la URL
    const urlPattern = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
    // Chequea si el control tiene un valor y si pasa la prueba de la expresión regular
    if (control.value && !urlPattern.test(control.value)) {
      // Retorna un objeto de error si la validación falla
      return { invalidUrl: true };
    }
    // Retorna null si la validación es exitosa (es decir, es una URL válida)
    return null;
  };
}

export function usernameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Verifica si contiene espacios
    const containsSpaces = /\s/.test(control.value);
    // Verifica si el valor sigue un patrón de URL
    const urlPattern = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

    if (control.value && (containsSpaces || urlPattern.test(control.value))) {
      // Retorna un objeto de error si alguna de las condiciones anteriores es verdadera
      return { invalidUsername: true };
    }
    // Retorna null si ninguna de las condiciones se cumple, indicando que el valor es válido
    return null;
  };
}

export function validateCardNumber(control: AbstractControl) {
  const cardNumber: string = control.value.replace(/\s/g, '');

  const visaRegex: RegExp = /^4[0-9]{12}(?:[0-9]{3})?$/;
  const mastercardRegex: RegExp = /^5[1-5][0-9]{14}$/;

  if (!visaRegex.test(cardNumber) && !mastercardRegex.test(cardNumber)) {
    return { unknownCard: true };
  }

  return null;
}

export function validateExpiryDate(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    // Comprobar primero si cumple con el formato básico MM / AA
    const formatValid = /^(0[1-9]|1[0-2])\s*\/\s*([0-9]{2})$/.test(value);
    if (!formatValid) {
      return { expiryFormat: true }; // Error de formato básico
    }

    // Separar el mes y el año para validación lógica
    const [monthStr, yearStr] = value.split(/\s*\/\s*/);
    const inputMonth = parseInt(monthStr, 10);
    // Convertimos el año de 2 dígitos a 4 dígitos (ej: "26" -> 2026, "00" -> 2000)
    const inputYear = parseInt('20' + yearStr, 10);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Los meses en JS van de 0 a 11
    const currentYear = currentDate.getFullYear();

    // Validar si el año ya pasó (así evitamos el '00' y años viejos)
    if (inputYear < currentYear) {
      return { expiredYear: true };
    }

    // Si es el año actual, comprobar que el mes no haya pasado
    if (inputYear === currentYear && inputMonth < currentMonth) {
      return { expiredMonth: true };
    }

    return null; // Todo está perfecto
  };
}

/*
export class CustomValidators {
  static patternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.value) {
        // if control is empty return no error
        return null;
      }

      // test the value of the control against the regexp supplied
      const valid = regex.test(control.value);

      // if true, return no error (no error), else return error passed in the second parameter
      return valid ? null : error;
    };
  }

  static confirmarPassword(control: AbstractControl) {
    const password: string = control.get('password').value; // obtener password del formulario
    const confirmar_password: string = control.get('confirmar_password').value; // obtener confirmar_password
    // comparar la contraseña
    if (password !== confirmar_password) {
      // si no coinciden, configure un error en nuestro control de formulario confirmar_password
      control.get('confirmar_password').setErrors({ NoPassswordMatch: true });
    }
  }
  static confirmarEmail(control: AbstractControl) {
    const email: string = control.get('email').value; // obtener password del formulario
    const confirmar_email: string = control.get('confirmar_email').value; // obtener confirmar_password
    // comparar la contraseña
    if (email !== confirmar_email) {
      // si no coinciden, configure un error en nuestro control de formulario confirmar_password
      control.get('confirmar_email').setErrors({ NoEmailMatch: true });
    }
  }
  static verificarAlias(control: AbstractControl) {
    const alias: string = control.get('alias').value; // obtener password del formulario
    // comparar la contraseña
    if (alias === 'hola') {
      // si no coinciden, configure un error en nuestro control de formulario confirmar_password
      control.get('alias').setErrors({ AliasExiste: true });
    }
  }
  static duracionVerificar(control: AbstractControl) {
    const duracion: number = control.get('duracion').value; // obtener duracion del formulario
    // comparar la contraseña
    if (duracion < 1 || duracion > 60) {
      // si esta fuera del rango, configure un error en nuestro control de formulario
      control.get('duracion').setErrors({ DuracionRango: true });
    }
  }
}
*/
