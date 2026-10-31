import { Money } from "./money";
import { MoneyConvert } from "./moneyConvert";

export interface ProductCredit {
    _id?: string;
    credit?: number;
    bonus?: number;
    Money?: Money;

    price?: number;
    discount?: number;
    priceTotal?: number;

    MoneyConvert?: MoneyConvert;
    // CONTROL
    active: boolean;
    edit: boolean;
    delete: boolean;
    updatedAt: Date;
    createdAt: Date;

}