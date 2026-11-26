import { Money } from "./money";
import { PostMedia } from "./postMedia";

export interface PaymentMethodCategory {
    _id?: string;
    code?: string;
    name?: string;
    description?: string;
    icon?: PostMedia[];
    Money?: Money;
    status?: boolean;
    updateAt?: string;
    createdAt?: string;
}

export interface ResponsePaymentMethodCategory {
    total: number;
    data: PaymentMethodCategory[];
};