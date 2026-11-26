import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { IconDirective } from '@directive/coin-svg.directive';
import { UIStyles } from '@core/common/uistyles';

@Component({
  selector: 'app-search-activity',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomTranslatePipe,
    IconDirective,
  ],
  templateUrl: './search-activity.component.html',
  styleUrl: './search-activity.component.scss',
})
export default class SearchActivityComponent {

  @Output() close = new EventEmitter<void>();
  @Output() searchSubmit = new EventEmitter<{ q: string; status: string; type: string; order: string }>();

  public className = UIStyles;
  public myFormSearch!: FormGroup;

  ngOnInit(): void {
    this.createFormControls();
  }

  createFormControls() {
    this.myFormSearch = new FormGroup({
      q: new FormControl(null, Validators.nullValidator),
      status: new FormControl('', Validators.nullValidator),
      type: new FormControl('', Validators.nullValidator),
      transaction: new FormControl(null, Validators.nullValidator),
      order: new FormControl('', Validators.nullValidator)
    });
  }

  onSubmit() {
    this.searchSubmit.emit({
      q: this.myFormSearch.value.q,
      status: this.myFormSearch.value.status,
      type: this.myFormSearch.value.type,
      order: this.myFormSearch.value.order
    });
  }

  onClose() {
    this.close.emit();
  }

  inputClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  selectClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }
}
