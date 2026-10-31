import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLinkWithHref } from '@angular/router';

@Component({
    selector: 'app-not-found',
    imports: [
        RouterLinkWithHref
    ],
    templateUrl: './not-found.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './not-found.component.scss'
})
export default class NotFoundComponent {

}
