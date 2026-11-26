import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownPostComponent } from './dropdown-post.component';

describe('DropdownPostComponent', () => {
  let component: DropdownPostComponent;
  let fixture: ComponentFixture<DropdownPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownPostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DropdownPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
