import { ComponentFixture, TestBed } from '@angular/core/testing';

import P2pOrderChatComponent from './p2p-order-chat.component';

describe('P2pOrderChatComponent', () => {
  let component: P2pOrderChatComponent;
  let fixture: ComponentFixture<P2pOrderChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [P2pOrderChatComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(P2pOrderChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
