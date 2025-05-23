import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { HeaderComponent } from './components/header/header.component';
import { CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgrammingLanguageService } from './services/programming-language/programming-language.service';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { UserManagementService } from './services/user-management-service/user-management.service';
import { ApiService } from './services/api/api.service';
import { TransportCodeService } from './services/transport-code/transport-code.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    CommonModule,
    FormsModule,
    MonacoEditorModule,
  ],
  providers: [
    AuthService,
    ProgrammingLanguageService,
    UserManagementService,
    ApiService,
    TransportCodeService,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  title = 'UnitTest';
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.renderer.setStyle(
      this.el.nativeElement.ownerDocument.body,
      'backgroundColor',
      '#01141B'
    );
  }
}
