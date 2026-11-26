import { ComponentFixture, TestBed } from '@angular/core/testing';

import CybersourceUnifiedPayComponent from './cybersource-unified-pay.component';

describe('CybersourceUnifiedPayComponent', () => {
  let component: CybersourceUnifiedPayComponent;
  let fixture: ComponentFixture<CybersourceUnifiedPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CybersourceUnifiedPayComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CybersourceUnifiedPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
