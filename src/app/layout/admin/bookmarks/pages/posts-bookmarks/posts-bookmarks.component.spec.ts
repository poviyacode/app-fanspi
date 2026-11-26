import { ComponentFixture, TestBed } from '@angular/core/testing';

import PostsBookmarksComponent from './posts-bookmarks.component';

describe('PostsBookmarksComponent', () => {
  let component: PostsBookmarksComponent;
  let fixture: ComponentFixture<PostsBookmarksComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostsBookmarksComponent]
    });
    fixture = TestBed.createComponent(PostsBookmarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
