import { ComponentFixture, TestBed } from '@angular/core/testing';

import UsersAgencyComponent from './users-agency.component';

describe('UsersAgencyComponent', () => {
  let component: UsersAgencyComponent;
  let fixture: ComponentFixture<UsersAgencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersAgencyComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UsersAgencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
