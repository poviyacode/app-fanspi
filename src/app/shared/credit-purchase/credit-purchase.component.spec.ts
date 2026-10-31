import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditPurchaseComponent } from './credit-purchase.component';

describe('CreditPurchaseComponent', () => {
  let component: CreditPurchaseComponent;
  let fixture: ComponentFixture<CreditPurchaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditPurchaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditPurchaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
