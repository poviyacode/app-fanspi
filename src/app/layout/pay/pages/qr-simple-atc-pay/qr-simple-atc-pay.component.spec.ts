import { ComponentFixture, TestBed } from '@angular/core/testing';

import QrSimpleAtcPayComponent from './qr-simple-atc-pay.component';

describe('QrSimpleAtcPayComponent', () => {
  let component: QrSimpleAtcPayComponent;
  let fixture: ComponentFixture<QrSimpleAtcPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrSimpleAtcPayComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(QrSimpleAtcPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
