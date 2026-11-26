import { ComponentFixture, TestBed } from '@angular/core/testing';

import ViewDetailActivityComponent from './view-detail-activity.component';

describe('ViewDetailActivityComponent', () => {
  let component: ViewDetailActivityComponent;
  let fixture: ComponentFixture<ViewDetailActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewDetailActivityComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ViewDetailActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
