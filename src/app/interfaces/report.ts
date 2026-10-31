import { Post } from "./post";
import { User } from "./user";

export interface Report {
    _id?: string;
    User?: User;
    Post?: Post;
    text? : string;
    active?: boolean;
    edit?: boolean;
    updateAt?: string;
    createdAt?: string;
}

