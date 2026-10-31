import { Message } from "./message";
import { Post } from "./post";
import { User } from "./user";

export interface PostMedia {
    _id?: string;

    urlSmall?: string;
    keySmall?: string;

    urlCover?: string;
    keyCover?: string;
    typeCover?: string;
    extensionCover?: string;

    urlSnapshot?: string;
    keySnapshot?: string;
    typeSnapshot?: string;
    extensionSnapshot?: string;

    url?: string;
    key?: string;
    type?: string;
    extension?: string;
    cover?: boolean;

    Post?: Post;
    Message?: Message;
    User?: User;

    cloudflare?: any;
    urlVideo?: string;
}
