import { ComponentFixture, TestBed } from '@angular/core/testing';

import MultiChatComponent from './multi-chat.component';

describe('MultiChatComponent', () => {
  let component: MultiChatComponent;
  let fixture: ComponentFixture<MultiChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiChatComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MultiChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
