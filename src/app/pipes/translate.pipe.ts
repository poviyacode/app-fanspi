import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false // Permite que se actualice automáticamente al cambiar de idioma
})
export class CustomTranslatePipe implements PipeTransform {
    private translate = inject(TranslateService);

    transform(key: string, interpolateParams?: Object): string {
        return this.translate.instant(key, interpolateParams);
    }
}