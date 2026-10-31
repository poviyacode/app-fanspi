import { Post } from "./post";
import { User } from "./user";

export interface SocialMedia {
    _id?: string;
    User?: User;
    type?: string;
    phonePrefix? : string;
    phone?: number;
    username?: string;
    order?: string;
    integration?: string;
    integrationActive?: boolean;
    channetId?: string;
    token?: string;

    link?: string;
    active?: boolean;
    edit?: boolean;
    updateAt?: string;
    createdAt?: string;
}
