
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ToolsService } from '@services/tools.service';

@Component({
  selector: 'app-head-pay',
  imports: [
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './head-pay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './head-pay.component.scss'
})
export default class HeadPayComponent {

  langs: any[] = [
    { value: 'en', name: 'English' },
    { value: 'es', name: 'Español' },
    { value: 'pt_BR', name: 'Portugués' },
    { value: 'fr', name: 'Français' },
    { value: 'it', name: 'Italiano' },
    { value: 'de', name: 'Deutsch' },
    { value: 'ja', name: '日本語' },
    { value: 'ko', name: '한국어' },
    { value: 'ru', name: 'Pусский' },
    { value: 'tr', name: 'Türkçe' },
    { value: 'zh', name: '中文' },
  ];

  myformLanguage: FormGroup;

  private fb = inject(FormBuilder);
  private toolsService = inject(ToolsService);
  private translate = inject(TranslateService);

  ngOnInit(): void {
    let lang = this.toolsService.language() || window.navigator.language.split('-')[0];
    this.myformLanguage = this.fb.group({ language: [lang, Validators.required] });
  }

  changeLang(lang: string) {
    this.toolsService.languageCreate(lang);
    this.translate.use(lang);
  }
}
