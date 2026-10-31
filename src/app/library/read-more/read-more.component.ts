import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { Tools } from '../../core/common/tools';

@Component({
  selector: 'read-more',
  imports: [CustomTranslatePipe],
  templateUrl: './read-more.component.html',
  styleUrl: './read-more.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
      div.collapsed {
          overflow: hidden;
      }
  `]
})
export class ReadMoreComponent {

  @Input() text: string = '';
  @Input() maxHeight: number = 25;

  public isCollapsed: boolean = false;
  public isCollapsable: boolean = false;

  @ViewChild('textContainer') textContainer!: ElementRef;

  constructor(private cd: ChangeDetectorRef) { }

  ngAfterViewInit() {
    setTimeout(() => {
      const currentHeight = this.textContainer.nativeElement.offsetHeight;
      if (currentHeight > this.maxHeight) {
        this.isCollapsed = true;
        this.isCollapsable = true;
      } else {
        this.isCollapsable = false;
      }

      this.cd.detectChanges();
    });
  }

  onChange() {
    this.isCollapsed = !this.isCollapsed;
  }
}
