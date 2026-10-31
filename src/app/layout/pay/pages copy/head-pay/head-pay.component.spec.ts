import { ComponentFixture, TestBed } from '@angular/core/testing';

import HeadPayComponent from './head-pay.component';

describe('HeadPayComponent', () => {
  let component: HeadPayComponent;
  let fixture: ComponentFixture<HeadPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadPayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeadPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
