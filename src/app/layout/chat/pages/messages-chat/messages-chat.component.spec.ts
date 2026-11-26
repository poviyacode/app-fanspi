import { ComponentFixture, TestBed } from '@angular/core/testing';

import MessagesChatComponent from './messages-chat.component';

describe('MessagesChatComponent', () => {
  let component: MessagesChatComponent;
  let fixture: ComponentFixture<MessagesChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MessagesChatComponent]
    });
    fixture = TestBed.createComponent(MessagesChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
