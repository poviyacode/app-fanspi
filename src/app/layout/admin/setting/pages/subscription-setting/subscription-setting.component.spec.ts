import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionSettingComponent } from './subscription-setting.component';

describe('SubscriptionSettingComponent', () => {
  let component: SubscriptionSettingComponent;
  let fixture: ComponentFixture<SubscriptionSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionSettingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
