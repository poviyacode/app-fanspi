
export interface Site {
  _id?: string;
  code?: string;
  name?: string;
  domain?: string;
}

export interface ResSiteRedirect {
  SiteAfter: Site,
  SiteCurrent: Site
}