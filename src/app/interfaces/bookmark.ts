import { Post } from "./post";
import { User } from "./user";


export interface Bookmark {
    _id?: string;
    Post?: Post;
    User?: User;
    like?: true;
    updateAt?: string;
    createdAt?: string;
}