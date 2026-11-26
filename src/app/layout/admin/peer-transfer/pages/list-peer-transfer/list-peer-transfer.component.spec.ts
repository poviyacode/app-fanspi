import { ComponentFixture, TestBed } from '@angular/core/testing';

import ListPeerTransferComponent from './list-peer-transfer.component';

describe('ListPeerTransferComponent', () => {
  let component: ListPeerTransferComponent;
  let fixture: ComponentFixture<ListPeerTransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListPeerTransferComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ListPeerTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
