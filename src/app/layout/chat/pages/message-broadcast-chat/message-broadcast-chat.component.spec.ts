import { ComponentFixture, TestBed } from '@angular/core/testing';

import MessageBroadcastChatComponent from './message-broadcast-chat.component';

describe('MessageBroadcastChatComponent', () => {
  let component: MessageBroadcastChatComponent;
  let fixture: ComponentFixture<MessageBroadcastChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageBroadcastChatComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MessageBroadcastChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
