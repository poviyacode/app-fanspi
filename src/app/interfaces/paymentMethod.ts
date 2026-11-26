import { Money } from "./money";
import { PaymentMethodCategory } from "./paymentMethodCategory";
import { CreditCalculator } from "./transactionCredit";
import { User } from "./user";


export interface PaymentMethod {
    _id?: string;
    User?: User;
    Money?: Money;
    PaymentMethodCategory?: PaymentMethodCategory;
    type?: string;
    status?: string;
    details?: any;
    primary?: boolean;
    updateAt?: string;
    createdAt?: string;
}

export interface ResponsePaymentMethod {
    paymentMethods?: PaymentMethod[],
    binance?: PaymentMethod | null,
    airtm?: PaymentMethod | null,
    paypal?: PaymentMethod | null,
    stripe?: PaymentMethod | null,
    creditCalculator?: CreditCalculator,
};