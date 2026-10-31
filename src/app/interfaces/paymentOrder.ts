import { Country } from "./country";
import { CountryState } from "./countryState";
import { Money } from "./money";
import { User } from "./user";

export enum StatusPaymentOrder {
    PETITION = 'PETITION',
    PENDING = 'PENDING',
    CANCELED = 'CANCELED',
    REVERTED = 'REVERTED',
    DECLINE = 'DECLINE',
    ERROR = 'ERROR',
    WITHHELD = 'WITHHELD',
    PAID = 'PAID'
}

export interface PaymentOrder {
    _id?: string;
    numberOrder?: number;
    codeCollection?: string;
    User?: User;
    Sender?: User;
    Receiver?: User;
    production?: boolean;
    amountTransaction?: number;
    MoneyTransaction?: Money;
    amountPay?: number;
    MoneyPay?: Money;
    Money?: Money;
    amount?: number;
    amountBalance?: number;

    totalAmountOrder?: number;
    remainingAmount?: number;
    installments?: any;

    name?: string;
    lastname?: string;
    email?: string;
    city?: string;
    address?: string;
    postalCode?: string;
    phone?: number;
    country?: string;

    status?: string;
    paymentType?: string;
    createdAt?: string;
    paymentMethod?: string;
    receipt?: any;

    gatewayDetails?: any;
    amountCalculation?: any;

    partialAmount?: number;
    attempts?: any[];
}

export interface ResPaymentOrderPay extends PaymentOrder {
    paymentMethodRole?: any,
    Country?: Country,
    Countries?: Country[],
    CountryStates?: CountryState[];
    amountCalculation?: {
        PayPalPersonal?: Calculation;
        StripeLLC?: Calculation;
        StripeINC?: Calculation;
        CyberSource?: Calculation;
    },
    gatewayError: {
        paymentMethod?: string,
        message?: string,
        reasonCode?: string,
        decision?: string
    }
}

export interface Calculation {
    amountPay: number,
    MoneyPay: Money,
    amountTransaction: number,
    MoneyTransaction: Money,
    amountDiscount: number,
    amountSurcharge: number,
    amountBalance: number,
    comissionAmount: number,
    comissionPercentage: number,
    invoiceAmount: number,
    invoicePercentage: number,
    settlement: number,
    settlementStatus: string,
}


export interface PayWithOrder {
    codeCollection?: string,
    partialAmount?: number,
    paymentMethod?: string,
    Money?: Money;
}
