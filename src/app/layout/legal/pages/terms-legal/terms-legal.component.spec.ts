import { ComponentFixture, TestBed } from '@angular/core/testing';

import TermsLegalComponent from './terms-legal.component';

describe('TermsLegalComponent', () => {
  let component: TermsLegalComponent;
  let fixture: ComponentFixture<TermsLegalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsLegalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermsLegalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
