
import { User } from "./user";

export interface Cam {

    _id?: string;
    User?: User;
    roomId? : string;
    active?: boolean;
    updateAt?: string;
    createdAt?: string;
}

