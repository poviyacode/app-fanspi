import { ComponentFixture, TestBed } from '@angular/core/testing';

import CybersourcePayComponent from './cybersource-pay.component';

describe('CybersourcePayComponent', () => {
  let component: CybersourcePayComponent;
  let fixture: ComponentFixture<CybersourcePayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CybersourcePayComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CybersourcePayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
