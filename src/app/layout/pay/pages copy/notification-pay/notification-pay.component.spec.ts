import { ComponentFixture, TestBed } from '@angular/core/testing';

import NotificationPayComponent from './notification-pay.component';

describe('NotificationPayComponent', () => {
  let component: NotificationPayComponent;
  let fixture: ComponentFixture<NotificationPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationPayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
