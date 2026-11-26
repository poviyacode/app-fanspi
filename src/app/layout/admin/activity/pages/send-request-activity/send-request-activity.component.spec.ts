import { ComponentFixture, TestBed } from '@angular/core/testing';

import SendRequestActivityComponent from './send-request-activity.component';

describe('SendRequestActivityComponent', () => {
  let component: SendRequestActivityComponent;
  let fixture: ComponentFixture<SendRequestActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendRequestActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendRequestActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
