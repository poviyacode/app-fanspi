import { Post } from "./post";
import { Subscription } from "./subscription";
import { User } from "./user";


export interface Bookmark {
    _id?: string;
    Post?: Post;
    User?: User;
    like?: true;
    Subscription?: Subscription;
    currentSubscriptionDate?: any;
    updateAt?: string;
    createdAt?: string;
}