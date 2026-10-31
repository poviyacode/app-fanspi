import { Money } from "./money";
import { StateCity } from "./stateCity";
import { User } from "./user";

export interface Membership {

    _id?: string;
    credit? : number;
    creditReal? : number;
    discount?: number;
    quantyTime?: number;
    typeTime?: string;
    type?: string;
    User?: User;
    updateAt?: string;
    createdAt?: string;
}

