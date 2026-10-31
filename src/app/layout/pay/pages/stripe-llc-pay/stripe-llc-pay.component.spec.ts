import { ComponentFixture, TestBed } from '@angular/core/testing';

import StripeLlcPayComponent from './stripe-llc-pay.component';

describe('StripeLlcPayComponent', () => {
  let component: StripeLlcPayComponent;
  let fixture: ComponentFixture<StripeLlcPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StripeLlcPayComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(StripeLlcPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
