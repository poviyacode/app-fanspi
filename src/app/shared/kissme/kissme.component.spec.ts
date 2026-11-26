import { ComponentFixture, TestBed } from '@angular/core/testing';

import KissmeComponent from './kissme.component';

describe('KissmeComponent', () => {
  let component: KissmeComponent;
  let fixture: ComponentFixture<KissmeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KissmeComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(KissmeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
