import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as monaco from 'monaco-editor';
import { TransportResponseService } from '../../services/transport-response/transport-response.service';
import { TransportCodeService } from '../../services/transport-code/transport-code.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { tap } from 'rxjs';
import { IContent, IMessage } from '../../interfaces/request.interface';
import { query } from '@angular/animations';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-text-highlighter',
  standalone: true,
  templateUrl: './text-highlighter.component.html',
  styleUrls: ['./text-highlighter.component.scss'],
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
})
export class TextHighlighterComponent implements OnInit {
  public isLoading: boolean = false;
  private _apiMessage: string = 'http://localhost:5001/api/v1/messages';
  editor: monaco.editor.IStandaloneCodeEditor | undefined;
  public message!: string;
  @Output()
  public editorInitialized = new EventEmitter<void>();

  constructor(
    private transportResponse: TransportResponseService,
    private httpClient: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private transportCode: TransportCodeService,
    public themeService: ThemeService
  ) {}
  ngOnInit() {
    this.transportResponse.currentRes.subscribe((message) => {
      this.message = message;
    });
    this.initEditor();
  }

  initEditor() {
    monaco.editor.defineTheme('my-dark', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#CDC6C6',
      },
    });
    this.message = this.message.replace('```', '').replace('```', '');
    const lang: string = this.message.split('\n')[0];
    this.editor = monaco.editor.create(document.getElementById('editor')!, {
      value: this.message,
      language: lang,
      theme: 'my-dark',
      automaticLayout: true,
    });

    this.editor.onDidChangeModelContent(() => {
      this.code = this.editor!.getValue();
    });
  }

  code: string = '';
  selectedCode: string = '';
  buttonPosition = { top: '0px', left: '0px' };
  public getCode(): string | undefined {
    return this.editor!.getModel()?.getValueInRange(
      this.editor?.getSelection() as monaco.IRange
    );
  }

  selectedText: string = '';
  showButton: boolean = false;
  id!: string;

  getSelectedText(event: MouseEvent) {
    this.setButtonPosition(event);
    const selection: string | undefined = this.getCode();
    if (selection!.length > 0) {
      this.selectedText = selection!;
      this.showButton = this.selectedText!.length > 0;
    } else {
      this.selectedText = '';
      this.showButton = false;
    }
  }

  getInfo() {
    this.selectedCode += '\n' + this.selectedText;
  }

  setButtonPosition(event: MouseEvent) {
    this.buttonPosition.top = `${event.clientY}px`;
    this.buttonPosition.left = `${event.clientX}px`;
  }

  public sendRepeat() {
    this.isLoading = true;
    this.route.queryParams.subscribe((params) => {
      this.id = params['id'];
    });
    const lang: string = this.message.split('\n')[0];
    const message: IMessage = {
      model: lang,
      chatId: this.id,
      message: `Fix this unit test function: ${this.selectedCode}
      
      The answer should contain only valid test code without comments or explanations,
      but don't import this function and don't generate code of this function in answer also write code only without comments.`,
    };
    this.httpClient
      .post<IContent>(this._apiMessage, message)
      .pipe(
        tap((res: IContent) => {
          this.continueWorkAfterResponse(res.content);
        })
      )
      .subscribe(
        () => {},
        (error) => {
          console.error('Ошибка при отправке сообщения:', error);
        }
      );
  }

  public async continueWorkAfterResponse(res: string) {
    this.isLoading = false;
    this.transportResponse.changeCode(res);
    await this.router
      .navigateByUrl('/', { skipLocationChange: true })
      .then(() => {
        this.router.navigate(['/response'], {
          queryParams: { id: this.id },
        });
      });
  }
}
