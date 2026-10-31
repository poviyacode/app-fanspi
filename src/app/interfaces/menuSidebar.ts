export interface  MenuSidebar {
    link_name?: string;
    link?: null | string;
    icon?: string;
    sub_menu?: MenuSidebar[];
    exact?: boolean;
  }
