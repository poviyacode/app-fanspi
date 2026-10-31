import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateAgoPipe } from './date-ago.pipe';
import { NumberMoneyPipe } from './number-money.pipe';
import { ThousandsPipe } from './thousands.pipe';
import { LowercasePipe } from './lowercase.pipe';
import { DateDifferencePipe } from './date-difference.pipe';
import { TruncatePipe } from './truncate.pipe';
import { DomainPipe } from './domain.pipe';
import { DateAgoTodayPipe } from './date-ago.-today.pipe';
import { DateAgoTimePipe } from './date-ago-time.pipe';


@NgModule({
  declarations: [
    DateAgoPipe,
    DateAgoTodayPipe,
    NumberMoneyPipe,
    ThousandsPipe,
    LowercasePipe,
    DateDifferencePipe,
    TruncatePipe,
    DomainPipe,
    DateAgoTimePipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DateAgoPipe,
    DateAgoTodayPipe,
    NumberMoneyPipe,
    ThousandsPipe,
    LowercasePipe,
    DateDifferencePipe,
    TruncatePipe,
    DomainPipe,
    DateAgoTimePipe
  ]
})
export class PipesModule { }
