import { ComponentFixture, TestBed } from '@angular/core/testing';

import ListSubscribersComponent from './list-subscribers.component';

describe('ListSubscribersComponent', () => {
  let component: ListSubscribersComponent;
  let fixture: ComponentFixture<ListSubscribersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListSubscribersComponent]
    });
    fixture = TestBed.createComponent(ListSubscribersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
