import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SibermenuDialogComponent } from './sibermenu-dialog.component';

describe('SibermenuDialogComponent', () => {
  let component: SibermenuDialogComponent;
  let fixture: ComponentFixture<SibermenuDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SibermenuDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SibermenuDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
