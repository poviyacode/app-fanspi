import { ComponentFixture, TestBed } from '@angular/core/testing';

import SoundSelectorComponent from './sound-selector.component';

describe('SoundSelectorComponent', () => {
  let component: SoundSelectorComponent;
  let fixture: ComponentFixture<SoundSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoundSelectorComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SoundSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
