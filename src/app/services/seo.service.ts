import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '@environments/environment';
import { MetaTag } from '@interfaces/metaTags';
import { AuthService } from './auth.service';

export interface seo {
    keyworks?: string;
    title?: string;
    description?: string;
    path?: string;
    url?: string;
    image?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SeoService {

    private meta = inject(Meta);
    private authService = inject(AuthService);

    updateMetaTags(metaTag: MetaTag) {

        const maxTitleLength = 50;
        const maxDescriptionLength = 100;

        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            const domain = window.location.origin;
        }

        let title = metaTag.title ? metaTag.title : '';
        let description = metaTag.description ? metaTag.description : '';

        if (title.length > maxTitleLength) {
            const truncated = title.slice(0, maxTitleLength);
            title = truncated.slice(0, truncated.lastIndexOf(' ')) + '...';
        }

        if (description.length > maxDescriptionLength) {
            const truncated = description.slice(0, maxDescriptionLength);
            description = truncated.slice(0, truncated.lastIndexOf(' ')) + '...';
        }

        const data: MetaTag = {
            title: title,
            description: description,
            url: `${metaTag.url}`,
            image: metaTag.image,
        };

        this.meta.updateTag({ name: 'title', content: data.title! });
        this.meta.updateTag({ name: 'description', content: data.description! });

        this.meta.updateTag({ property: 'og:type', content: 'website' });
        this.meta.updateTag({ property: 'og:url', content: data.url! });
        this.meta.updateTag({ property: 'og:title', content: data.title! });
        this.meta.updateTag({ property: 'og:description', content: data.description! });
        this.meta.updateTag({ property: 'og:image', content: data.image! });

        this.meta.updateTag({ property: 'twitter:card', content: 'summary' });
        this.meta.updateTag({ property: 'twitter:url', content: data.url! });
        this.meta.updateTag({ property: 'twitter:title', content: data.title! });
        this.meta.updateTag({ property: 'twitter:description', content: data.description! });
        this.meta.updateTag({ property: 'twitter:image', content: data.image! });
    }
}
