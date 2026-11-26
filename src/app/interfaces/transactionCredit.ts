import { Membership } from "./membership";
import { Money } from "./money";
import { PaymentOrder } from "./paymentOrder";
import { ProductAdCredit } from "./productAdCredit";
import { ProductCredit } from "./productCredit";
import { User } from "./user";
import { PaymentMethod } from "./paymentMethod";
import { WithdrawalMoney } from "./withdrawalMoney";


export interface TransactionCredit {
    _id?: string;
    code?: string;
    ProductAdCredit?: ProductAdCredit;
    type?: string;
    Sender?: User;
    typeSender?: string;
    Receiver?: User;
    typeReceiver?: string;
    amount?: number;
    balance?: number;
    Money?: Money;
    creditAmount?: number;
    creditValue?: number;
    CreditValueMoney?: Money;
    ProductCredit?: ProductCredit;
    PaymentOrder?: PaymentOrder;
    WithdrawalMoney?: WithdrawalMoney;
    Membership?: Membership;
    PaymentMethod?: PaymentMethod;
    details?: object;
    settlementStatus?: string;
    status?: string;
    // CONTROL
    active?: boolean;
    edit?: boolean;
    delete?: boolean;

    registerAt?: string,
    updatedAt?: string;
    createdAt?: string;
}

export interface BalanceTransactionCredit {
    income: number,
    withdrawalMoneyAccept: number,
    withdrawalMoneyPending: number,
    withdrawalMoneyProcessing: number,
    withdrawnMoney: number,
    availableMoney: number,
    withdrawal: number,
    balance: number,
}

export interface CreditCalculator {
    quantityCoin: number
    priceCoinUnityCreator: number,
    priceCoinUnitBuyOfficial: number,
    priceCoinUnitBuyParallel: number

    priceCoin?: number;
    utility: {
        creatorUtilityAmount: number,
        houseUtilityAmount: number
    },
    percentage: {
        creatorPercentage: number,
        housePercentage: number
    },
    exchange: {
        exchangeRateOfficial: number,
        exchangeRateParallel: number
    }
}

export interface UserCredit {
    buy?: number;
    input?: number;
    output?: number;
    current?: number;
}
