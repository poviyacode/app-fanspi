import { ComponentFixture, TestBed } from '@angular/core/testing';

import ListSubscriptionsComponent from './list-subscriptions.component';

describe('ListSubscriptionsComponent', () => {
  let component: ListSubscriptionsComponent;
  let fixture: ComponentFixture<ListSubscriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSubscriptionsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ListSubscriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
