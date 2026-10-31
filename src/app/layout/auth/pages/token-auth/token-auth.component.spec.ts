import { ComponentFixture, TestBed } from '@angular/core/testing';

import TokenAuthComponent from './token-auth.component';

describe('TokenAuthComponent', () => {
  let component: TokenAuthComponent;
  let fixture: ComponentFixture<TokenAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TokenAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
