import { HttpClient } from "@angular/common/http";
import { TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function createTranslateLoader(http: HttpClient) {
    const version = new Date().getTime(); // Agrega un timestamp único
    return new TranslateHttpLoader(http, './public/i18n/', `.json?version=${version}`);
}

export function provideTranslation() {
    let lang = 'en';
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        lang = localStorage.getItem('language')!;
        if (!lang) {
            const langNavigator = window.navigator.language;
            const langArray = langNavigator.split('-');
            lang = langArray[0];
        }
    }
    return {
        defaultLanguage: lang,
        loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader),
            deps: [HttpClient]
        },
    }
}
