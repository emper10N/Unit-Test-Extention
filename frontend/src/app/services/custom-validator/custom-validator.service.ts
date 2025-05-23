import { AbstractControl, ValidationErrors } from '@angular/forms';

export class CustomValidators {
  public static emailValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const email = control.value;
    const validEmailPattern: RegExp =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!validEmailPattern.test(email)) {
      return { emailValidator: true };
    }

    return null;
  }

  public static matchValidator(
    controlName: string,
    matchingControlName: string
  ): ValidationErrors | null {
    return (abstractControl: AbstractControl) => {
      const control = abstractControl.get(controlName);
      const matchingControl = abstractControl.get(matchingControlName);

      if (
        matchingControl!.errors &&
        !matchingControl!.errors?.['confirmedValidator']
      ) {
        return null;
      }

      if (control!.value !== matchingControl!.value) {
        const error = { confirmedValidator: true };
        matchingControl!.setErrors(error);
        return error;
      } else {
        matchingControl!.setErrors(null);
        return null;
      }
    };
  }

  public static uppercaseValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const hasUppercase = /[A-Z]/.test(control.value);
    return !hasUppercase ? { uppercase: true } : null;
  }

  public static lowercaseValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const hasUppercase = /[a-z]/.test(control.value);
    return !hasUppercase ? { lowercase: true } : null;
  }

  public static digitValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const hasDigit = /d/.test(control.value);
    return !hasDigit ? { digit: true } : null;
  }

  public static specialCharacterValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const hasSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(
      control.value
    );
    return !hasSpecialCharacter ? { specialCharacter: true } : null;
  }
}
