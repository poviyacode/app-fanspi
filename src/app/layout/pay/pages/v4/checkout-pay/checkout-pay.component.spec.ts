import { ComponentFixture, TestBed } from '@angular/core/testing';

import CheckoutPayComponent from './checkout-pay.component';

describe('CheckoutPayComponent', () => {
  let component: CheckoutPayComponent;
  let fixture: ComponentFixture<CheckoutPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutPayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckoutPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
