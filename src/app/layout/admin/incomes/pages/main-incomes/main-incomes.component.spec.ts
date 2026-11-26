import { ComponentFixture, TestBed } from '@angular/core/testing';

import MainIncomesComponent from './main-incomes.component';

describe('MainIncomesComponent', () => {
  let component: MainIncomesComponent;
  let fixture: ComponentFixture<MainIncomesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MainIncomesComponent]
    });
    fixture = TestBed.createComponent(MainIncomesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
