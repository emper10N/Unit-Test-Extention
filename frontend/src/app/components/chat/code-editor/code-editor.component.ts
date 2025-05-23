import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as monaco from 'monaco-editor';
import { TransportCodeService } from '../../../services/transport-code/transport-code.service';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: 'code-editor.component.html',
  styleUrls: ['style/code-editor.main.scss'],
})
export class CodeEditorComponent implements OnChanges, OnInit {
  @Input()
  public language!: string;
  public code: string = '';
  editor: monaco.editor.IStandaloneCodeEditor | undefined;

  constructor(private transportCode: TransportCodeService) {
    monaco.editor.defineTheme('my-dark', {
      base: 'vs', 
      inherit: true,
      rules: [],
      colors: {
        "editor.background": '#CDC6C6'
      }
    });
    if (this.language === undefined)
        this.language = 'c';
  }

  ngOnInit() {
    this.initEditor();
  }
  

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['language'] && !changes['language'].isFirstChange()) {
      this.changeLanguage(this.language);
    }
  }

  changeLanguage(newLanguage: string) {
    if (this.editor) {
      const model = this.editor.getModel();
         if (model) {
          console.log(1);
           monaco.editor.setModelLanguage(model, newLanguage);
           monaco.editor.setTheme('my-dark');
         }
    }
  }


  initEditor() {
    monaco.editor.defineTheme('my-dark', {
      base: 'vs', 
      inherit: true,
      rules: [],
      colors: {
        "editor.background": '#CDC6C6'
      }
    });
    this.editor = monaco.editor.create(document.getElementById('editor')!, {
      language: this.language,
      theme: 'my-dark',
      automaticLayout: true,
    });
    this.editor.onDidChangeModelContent(() => {
      this.sendCode();
    });
  }



  sendCode() {
    this.transportCode.changeCode(this.editor?.getValue()!);
  }
}
