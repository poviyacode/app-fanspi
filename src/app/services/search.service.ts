import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  public text: string;

  search() {
    return this.text;
  }

  searchText(text: string) {
    this.text = text;
  }

  private sharedDataSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  
  sharedData$: Observable<any> = this.sharedDataSubject.asObservable();

  setSharedData(data: any) {
    this.sharedDataSubject.next(data);
  }
}
