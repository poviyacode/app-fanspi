import { ComponentFixture, TestBed } from '@angular/core/testing';

import VerifiedAccountAuthComponent from './verified-account-auth.component';

describe('VerifiedAccountAuthComponent', () => {
  let component: VerifiedAccountAuthComponent;
  let fixture: ComponentFixture<VerifiedAccountAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifiedAccountAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifiedAccountAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
