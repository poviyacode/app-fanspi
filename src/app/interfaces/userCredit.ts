import { MoneyConvert } from "./moneyConvert";
import { User } from "./user";

export interface UserCredit {
    _id?: string;
    User?: User;
    buy?: number;
    input?: number;
    ouput?: number;
    withdrawal?: number;
    current?: number;
    Money?: string;
    amountBuy?: number;
    amountInput?: number;
    amountOuput?: number;
    amountWithdrawal?: number;
    status?: string;
    active?: boolean;
    edit?: boolean;
    delete?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    __v?: number;
}

export interface CreditValueBuy {
    creditBuy?: number,
    MoneyConvert?: MoneyConvert
}