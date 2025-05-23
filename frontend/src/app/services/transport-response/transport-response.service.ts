import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TransportResponseService {
  private resSubject = new BehaviorSubject<string>('');
  currentRes = this.resSubject.asObservable();

  changeCode(message: string) {
    this.resSubject.next(message);
  }
}
