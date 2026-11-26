import { PostMedia } from "./postMedia";
import { User } from "./user";

export interface LovenseProduct {
    _id?: string;
    code?: string;
    name?: string;
    PostMedia?: PostMedia[];
    nickName?: string;
    status?: number;
    active?: boolean;
    edit?: boolean;
    updateAt?: string;
    createdAt?: string;
}