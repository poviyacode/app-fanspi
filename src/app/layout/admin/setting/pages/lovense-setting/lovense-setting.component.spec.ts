import { ComponentFixture, TestBed } from '@angular/core/testing';

import LovenseSettingComponent from './lovense-setting.component';

describe('LovenseSettingComponent', () => {
  let component: LovenseSettingComponent;
  let fixture: ComponentFixture<LovenseSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LovenseSettingComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LovenseSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
