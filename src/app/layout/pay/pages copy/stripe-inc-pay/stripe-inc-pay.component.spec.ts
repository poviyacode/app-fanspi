import { ComponentFixture, TestBed } from '@angular/core/testing';

import StripeIncPayComponent from './stripe-inc-pay.component';

describe('StripeIncPayComponent', () => {
  let component: StripeIncPayComponent;
  let fixture: ComponentFixture<StripeIncPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StripeIncPayComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(StripeIncPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
