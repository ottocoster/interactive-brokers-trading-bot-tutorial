import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketDataGraphsComponent } from './market-data-graphs.component';

describe('MarketDataGraphsComponent', () => {
  let component: MarketDataGraphsComponent;
  let fixture: ComponentFixture<MarketDataGraphsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarketDataGraphsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketDataGraphsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
