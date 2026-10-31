import { ComponentFixture, TestBed } from '@angular/core/testing';

import QrAtcPayComponent from './qr-atc-pay.component';

describe('QrAtcPayComponent', () => {
  let component: QrAtcPayComponent;
  let fixture: ComponentFixture<QrAtcPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrAtcPayComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(QrAtcPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
