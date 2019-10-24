import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareSvgComponent } from './share-svg.component';

describe('ShareSvgComponent', () => {
  let component: ShareSvgComponent;
  let fixture: ComponentFixture<ShareSvgComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShareSvgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareSvgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
