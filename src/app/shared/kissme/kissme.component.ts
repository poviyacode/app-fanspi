import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { KissService } from '@services/kiss.service';

@Component({
  selector: 'app-kissme',
  imports: [],
  templateUrl: './kissme.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './kissme.component.scss'
})
export default class KissmeComponent {

  public kissService = inject(KissService);

}
