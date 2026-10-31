import { ComponentFixture, TestBed } from '@angular/core/testing';

import PaypalPayComponent from './paypal-pay.component';

describe('PaypalPayComponent', () => {
  let component: PaypalPayComponent;
  let fixture: ComponentFixture<PaypalPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaypalPayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaypalPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
