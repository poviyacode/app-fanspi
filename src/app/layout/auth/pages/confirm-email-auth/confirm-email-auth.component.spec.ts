import { ComponentFixture, TestBed } from '@angular/core/testing';

import ConfirmEmailAuthComponent from './confirm-email-auth.component';

describe('ConfirmEmailAuthComponent', () => {
  let component: ConfirmEmailAuthComponent;
  let fixture: ComponentFixture<ConfirmEmailAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmEmailAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmEmailAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
