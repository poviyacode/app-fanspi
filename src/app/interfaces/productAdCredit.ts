import { Country } from "./country";
import { Money } from "./money";


export interface ProductAdCredit {
    _id?: string;
    Country?: Country;
    days?: number;
    price?: number;
    type?: number;
    active?: boolean;
    edit?: boolean;
    delete?: boolean;
    createdAt?: Date;
    __v?: number;
    Money?: Money;
    credit?: number;
    updatedAt?: Date;
    descriptions?: string[];
}