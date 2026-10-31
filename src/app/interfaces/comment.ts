import { Post } from "./post";
import { User } from "./user";

export interface Comment {
    _id?: string;
    User?: User;
    Post?: Post;
    text? : string;
    active?: boolean;
    edit?: boolean;
    updateAt?: string;
    createdAt?: string;
}

export interface CommentLive { 
    ID: string,
    name: string,
    avatar: string,
    time?: string,
    content: string,
}

