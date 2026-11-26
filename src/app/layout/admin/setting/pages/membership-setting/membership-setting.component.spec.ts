import { ComponentFixture, TestBed } from '@angular/core/testing';

import MembershipSettingComponent from './membership-setting.component';

describe('MembershipSettingComponent', () => {
  let component: MembershipSettingComponent;
  let fixture: ComponentFixture<MembershipSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembershipSettingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembershipSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
