import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Site } from '@interfaces/site';
import { SiteService } from '@services/site.service';
import { SpinnerService } from '@services/spinner.service';

@Component({
  selector: 'app-main-profile',
  imports: [],
  templateUrl: './main-profile.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './main-profile.component.scss'
})
export default class MainProfileComponent {

  // ssr
  isBrowser: boolean;
  isServer: boolean;

  slug: string;

  private spinnerService = inject(SpinnerService);
  private platformId = inject(PLATFORM_ID);
  private activatedRoute = inject(ActivatedRoute);
  private siteService = inject(SiteService);

  constructor() {

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);

    if (this.isBrowser) {
      this.activatedRoute.paramMap.subscribe((params) => {
        this.slug = params.get('slug')!;

        this.onSite();

      });
    }

  }

  async onSite() {
    const data = {
      code: this.slug,
    }

    this.spinnerService.start();
    const site: Site = await this.siteService.findSite(data);
    this.spinnerService.close();
    window.open(site.domain, "_parent", "noopener,noreferrer");
  }
}
