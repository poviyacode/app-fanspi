import { Money } from "./money";
import { User } from "./user";


export interface UserTransfer {
    _id?: string;
    User: User;
    Money: Money;
    type?: string;
    status?: string; 
    details?: any;
    updateAt?: string;
    createdAt?: string;
}