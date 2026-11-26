import { ComponentFixture, TestBed } from '@angular/core/testing';

import InviteBannerComponent from './invite-banner.component';

describe('InviteBannerComponent', () => {
  let component: InviteBannerComponent;
  let fixture: ComponentFixture<InviteBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteBannerComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(InviteBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
