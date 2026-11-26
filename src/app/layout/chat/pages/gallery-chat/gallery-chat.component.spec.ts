import { ComponentFixture, TestBed } from '@angular/core/testing';

import GalleryChatComponent from './gallery-chat.component';

describe('GalleryChatComponent', () => {
  let component: GalleryChatComponent;
  let fixture: ComponentFixture<GalleryChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GalleryChatComponent]
    });
    fixture = TestBed.createComponent(GalleryChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
