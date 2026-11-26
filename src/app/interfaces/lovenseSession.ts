import { User } from "./user";

export interface LovenseSession {
    _id?: string;
    User?: User;
    uid?: string;
    payload?: any;
    status?: string;
    active?: boolean;
    edit?: boolean;
    updateAt?: string;
    createdAt?: string;
    message?: string;
}