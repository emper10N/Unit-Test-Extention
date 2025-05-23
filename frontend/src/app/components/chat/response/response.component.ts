import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgIf, NgTemplateOutlet } from '@angular/common';
import { CodeEditorComponent } from '../code-editor/code-editor.component';
import { ChoseComponent } from '../chose/chose.component';
import { ProgrammingLanguageService } from '../../../services/programming-language/programming-language.service';
import { TextHighlighterComponent } from '../../text-highlighter/text-highlighter.component';
import { TransportResponseService } from '../../../services/transport-response/transport-response.service';

@Component({
  selector: 'app-response-init',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    CommonModule,
    TextHighlighterComponent,
  ],
  templateUrl: 'response.component.html',
  styleUrl: 'style/response.main.scss',
})
export class ResponseComponent {
  public selectedLanguage: string | undefined;
  public choseLanguage: ProgrammingLanguageService = inject(
    ProgrammingLanguageService
  );

  public getFrameworks(): string[] {
    return this.selectedLanguage
      ? this.choseLanguage.getFrameworks(this.selectedLanguage)
      : [];
  }
}
