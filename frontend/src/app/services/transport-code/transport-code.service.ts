import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TransportCodeService {
  private codeSubject = new BehaviorSubject<string>('');
  currentCode = this.codeSubject.asObservable();

  changeCode(message: string) {
    this.codeSubject.next(message);
  }
}
