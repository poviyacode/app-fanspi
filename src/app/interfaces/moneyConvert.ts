import { Money } from "./money";

export interface MoneyConvert {
    _id?: string;
    BaseCurrency?: Money;
    TargetCurrency?: Money;
    amountBuyOfficial?: number;
    amountSellOfficial?: number;
    amountBuyParallel?: number; 
    amountSellParallel?: number;

    updateAt?: string;
    createdAt?: string;
}