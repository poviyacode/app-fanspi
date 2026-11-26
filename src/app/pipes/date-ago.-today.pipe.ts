import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { ToolsService } from '../services/tools.service';

@Pipe({
  name: 'dateAgoToday',
  pure: true
})
export class DateAgoTodayPipe implements PipeTransform {

  private intervalId: any;

  constructor(private toolsService: ToolsService, private cdr: ChangeDetectorRef) {
    this.intervalId = setInterval(() => {
      this.cdr.markForCheck();
    }, 1000); // actualiza cada segundo
  }

  transform(value: any, args?: any): any {
    const lang = this.toolsService.language();
    if (value) {
      const seconds = Math.floor((+new Date() - +new Date(value)) / 1000);
      if (seconds < 29) // less than 30 seconds ago will show as 'Just now'
        //return 'Just now';
        return 'now';
      const intervals: { [key: string]: number } = {
        /*'year': 31536000,
        'month': 2592000,
        'week': 604800,
        'day': 86400,
        'hour': 3600,
        'minute': 60,
        'second': 1
        */
        'year': 31536000,
        'month': 2592000,
        'week': 604800,
        'd': 86400,
        'h': 3600,
        'm': 60,
        's': 1
      };
      let counter;
      for (const i in intervals) {
        counter = Math.floor(seconds / intervals[i]);
        if (counter > 0)
          // if (counter === 1) {
          //     //return counter + ' ' + i + ' ago'; // singular (1 day ago)
          //     //return counter + ' ' + i;
          //     return 'hace ' + counter + ' ' + i;
          // } else {
          //     //return counter + ' ' + i + 's ago'; // plural (2 days ago)
          //     return 'hace ' + counter + ' ' + i + 's';
          // }

          if (i == 'd' || i == 'week' || i == 'month' || i == 'year') {
            let date = new Date(value);
            //let x = date.toLocaleDateString('en-US');
            let x = null;
            if (lang == 'es') {
              x = `${date.toLocaleDateString('es-ES')}`;
            } else {
              x = `${date.toLocaleDateString('en-US')}`;
            }
            // x = x.replace('/', '-');
            x = x.split('/');
            const moonLanding = new Date();
            const day = Number(x[1]) < 10 ? `0${x[1]}` : x[1];
            const month = Number(x[0]) < 10 ? `0${x[0]}` : x[0];
            const year = Number(x[2]);

            // if(year == moonLanding.getFullYear())
            // {
            //     return day + '-' +  month;
            // } else {
            //     return day + '-' + month + '-' + year;
            // }

            if (year == moonLanding.getFullYear()) {
              let date = new Date(value);
              const formattedDate = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
              return formattedDate;
            } else {
              let date = new Date(value);
              const formattedDate = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
              return formattedDate;
            }

          } else {
            //return counter + ' ' + i + 's ago'; // plural (2 days ago)
            if (i == 's' || i == 'm' || i == 'h') {
              return counter + i;
            }
            else if (i == 'd' || i == 'week' || i == 'month' || i == 'year') {
              let date = new Date(value);
              //let x = date.toLocaleDateString('en-US');
              let x = null;
              if (lang == 'es') {
                x = `${date.toLocaleDateString('es-ES')}`;
              } else {
                x = `${date.toLocaleDateString('en-US')}`;
              }
              x = x.replace('/', '-');
              return x.replace('/', '-');
            }
            else {
              {
                return counter + i + 's';
              }
            }
            //return 'hace ' + counter + ' ' + i + 's';
          }
      }
    }
    return value;
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
