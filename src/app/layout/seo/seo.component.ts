import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '@environments/environment';
import { SeoService } from '@services/seo.service';
import { MetaTag } from '@interfaces/metaTags';
import { UserService } from '@services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { User } from '@interfaces/user';
import { ToastService } from '@services/toast.service';

@Component({
    selector: 'app-seo',
    imports: [
    RouterModule
],
    templateUrl: './seo.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./seo.component.scss']
})
export default class SeoComponent implements OnInit {

  isBrowser: boolean;
  isServer: boolean;

  slug: null | string = null;
  
  private destroy$ = new Subject<void>();

  private platformId = inject(PLATFORM_ID);
  private activatedRoute = inject(ActivatedRoute);
  private seoService = inject(SeoService);
  public userService = inject(UserService);
  public toastService = inject(ToastService);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
  }

  ngOnInit() {

    this.activatedRoute.paramMap.subscribe((params) => {
      this.slug = params.get('slug');
      if (this.slug) {
        const data = {
          username: this.slug,
        };
        this.findOne();
      } else {
        const data = {
          username: 'bonita',
        };
        this.headPage0(data);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  findOne() {
    
    const data = {
      username: this.slug,
    }

    this.userService.slug(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.headPage(res.User);
          }

        },
        error: (err) => {
 
        },
        complete: () => {
          console.log('Request completed');
        }
      });
  }


  headPage(user: User) {
    const data: MetaTag = {
      title: user.username!,
      description: user.bio!,
      path: `seo/${user.username}`,
      image: user.Profile && user.Profile!.length > 0 && user.Profile![0].cloudflare && user.Profile![0].cloudflare.result.variants[0] ? user.Profile![0].cloudflare.result.variants[0] : user.Profile && user.Profile!.length > 0 ? user.Profile![0].url! : `https://${environment.domain}/public/logo/seo2.jpg`
    }
    this.seoService.updateMetaTags(data);
  }

  headPage0(user: any) {
    const data: MetaTag = {
      title: `${user.username}`,
      description: "Test is the social platform revolutionizing creator and fan connections. The site is inclusive of artists and content creators from all genres and allows them to monetize their content while developing authentic relationships with their fanbase.",
      path: `seo`,
      image: `${environment.domain}/public/logo/seo2.jpg`
    };

    console.log(data);
    this.seoService.updateMetaTags(data);
  }

  onToast() {
    ///this.toastService.start({ type: 'success', message: 'loginSuccess' });
    this.toastService.start({ type: 'error', message: 'emailPasswordIncorrect' });
  }

}
