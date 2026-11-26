
import { Component, inject, ChangeDetectionStrategy, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
export default class HeadPayComponent implements OnInit {

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

  private fb = inject(FormBuilder);
  private toolsService = inject(ToolsService);
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);

  // Inicializado de forma síncrona para evitar que sea undefined en SSR
  myformLanguage: FormGroup = this.fb.group({ language: ['en', Validators.required] });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      let lang = this.toolsService.language() || window.navigator?.language?.split('-')[0] || 'en';
      this.myformLanguage.patchValue({ language: lang });
    }
  }

  changeLang(lang: string) {
    this.toolsService.languageCreate(lang);
    this.translate.use(lang);
  }
}
