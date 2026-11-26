import { ComponentFixture, TestBed } from '@angular/core/testing';

import UniversalPaymentMethodSettingComponent from './universal-payment-method-setting.component';

describe('UniversalPaymentMethodSettingComponent', () => {
  let component: UniversalPaymentMethodSettingComponent;
  let fixture: ComponentFixture<UniversalPaymentMethodSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UniversalPaymentMethodSettingComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UniversalPaymentMethodSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
