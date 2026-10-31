import { ComponentFixture, TestBed } from '@angular/core/testing';

import MainPayComponent from './main-pay.component';

describe('MainPayComponent', () => {
  let component: MainPayComponent;
  let fixture: ComponentFixture<MainPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPayComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MainPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
