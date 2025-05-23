import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ValidatorsHandlerComponent } from '../../validators-handler/validators-handler.component';

export interface InputForm {
  type: 'text' | 'email' | 'password';
  placeholder: string;
}

@Component({
  selector: 'app-input-control',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputControlComponent),
      multi: true,
    },
  ],
  templateUrl: 'input-control.component.html',
  imports: [ValidatorsHandlerComponent, NgIf],
  styleUrl: 'styles/input.main.scss',
})
export class InputControlComponent implements ControlValueAccessor {
  public onChange: (value: string) => void = () => {};
  public onTouched: () => void = () => {};
  public value!: string;

  @Input() input!: InputForm;

  writeValue(value: string): void {
    this.value = value || '';
    this.onChange(this.value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
    const inputElement: HTMLInputElement = event.target as HTMLInputElement;
    this.value = inputElement.value;
    this.onChange(this.value);
  }
}
