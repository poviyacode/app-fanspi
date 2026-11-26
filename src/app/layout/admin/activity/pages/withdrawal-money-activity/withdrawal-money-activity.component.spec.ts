import { ComponentFixture, TestBed } from '@angular/core/testing';

import WithdrawalMoneyActivityComponent from './withdrawal-money-activity.component';

describe('WithdrawalMoneyActivityComponent', () => {
  let component: WithdrawalMoneyActivityComponent;
  let fixture: ComponentFixture<WithdrawalMoneyActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WithdrawalMoneyActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WithdrawalMoneyActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
