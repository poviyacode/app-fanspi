import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PixAtcPayComponent } from './pix-atc-pay.component';

describe('PixAtcPayComponent', () => {
  let component: PixAtcPayComponent;
  let fixture: ComponentFixture<PixAtcPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PixAtcPayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PixAtcPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
