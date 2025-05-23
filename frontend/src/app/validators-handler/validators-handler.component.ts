import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-validators-handler',
  standalone: true,
  imports: [ NgForOf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'validators-handler.component.html',
  styleUrl: 'style.scss'
})
export class ValidatorsHandlerComponent {
  public outErrors: string[] = [];
  private previousErrors?: ValidationErrors | null;

  @Input()
  public set errors(error: ValidationErrors | null) {
    if (
      this.previousErrors &&
      JSON.stringify(this.previousErrors) === JSON.stringify(error)
    ) {
      return;
    }
    this.outErrors = [];
    this.previousErrors = error;
    this.updateErrors(error);
  }

  private updateErrors(error: ValidationErrors | null): void {
    if (!error) {
      return;
    }

    const errorsObject: ValidationErrors = error as ValidationErrors;

    for (const err in errorsObject) {
      switch (err) {
        case 'uppercase':
          this.outErrors.push(
            'Пароль должен содержать заглавную букву латинского алфавита'
          );
          break;
        case 'lowercase':
          this.outErrors.push(
            'Пароль должен содержать строчную букву латинского алфавита'
          );
          break;
        case 'specialCharacter':
          this.outErrors.push('Пароль должен содержать специальный символ');
          break;
        case 'confirmedValidator':
          this.outErrors.push('Пароли должны совпадать');
          break;
        case 'required':
          this.outErrors.push('Обязательное поле');
          break;
        case 'minlength':
          this.outErrors.push(
            `Минимальная длина пароля - ${errorsObject[err].requiredLength} символов`
          );
          break;
        case 'maxlength':
          this.outErrors.push(
            `Максимальная длина пароля - ${errorsObject[err].requiredLength} символов`
          );
          break;
        case 'emailValidator':
          this.outErrors.push('Некорректный формат email');
          break;
      }
    }
  }
}
