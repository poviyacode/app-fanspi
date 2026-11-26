import { ComponentFixture, TestBed } from '@angular/core/testing';

import ListPaymentMethodSettingComponent from './list-payment-method-setting.component';

describe('ListPaymentMethodSettingComponent', () => {
  let component: ListPaymentMethodSettingComponent;
  let fixture: ComponentFixture<ListPaymentMethodSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListPaymentMethodSettingComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ListPaymentMethodSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
