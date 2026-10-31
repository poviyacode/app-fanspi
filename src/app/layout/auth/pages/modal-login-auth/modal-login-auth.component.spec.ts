import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalLoginAuthComponent } from './modal-login-auth.component';

describe('ModalLoginAuthComponent', () => {
  let component: ModalLoginAuthComponent;
  let fixture: ComponentFixture<ModalLoginAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalLoginAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalLoginAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
