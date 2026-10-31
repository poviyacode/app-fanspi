import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalPayComponent } from './personal-pay.component';

describe('PersonalPayComponent', () => {
  let component: PersonalPayComponent;
  let fixture: ComponentFixture<PersonalPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalPayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
