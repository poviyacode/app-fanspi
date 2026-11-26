import { ComponentFixture, TestBed } from '@angular/core/testing';

import MediaChatComponent from './media-chat.component';

describe('MediaChatComponent', () => {
  let component: MediaChatComponent;
  let fixture: ComponentFixture<MediaChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
