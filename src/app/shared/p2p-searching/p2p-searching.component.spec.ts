import { ComponentFixture, TestBed } from '@angular/core/testing';

import P2pSearchingComponent from './p2p-searching.component';

describe('P2pSearchingComponent', () => {
  let component: P2pSearchingComponent;
  let fixture: ComponentFixture<P2pSearchingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [P2pSearchingComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(P2pSearchingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
