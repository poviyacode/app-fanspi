import { User } from "./user";

export interface Subscription {

    _id?: string;
    User? : User;
    Join?: User;
    type?: string;
    expirationDate?: number;
    expired: boolean;
    status?: string;
    search?: string;
    updateAt?: string;
    createdAt?: string;
}

