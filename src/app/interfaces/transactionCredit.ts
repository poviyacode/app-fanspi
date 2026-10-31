import { Membership } from "./membership";
import { Money } from "./money";
import { PaymentOrder } from "./paymentOrder";
import { ProductAdCredit } from "./productAdCredit";
import { ProductCredit } from "./productCredit";
import { User } from "./user";
import { UserTransfer } from "./userTransfer";
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
    UserTransfer?: UserTransfer;
    details?: object;
    settlementStatus?: string;
    status?: string;
    // CONTROL
    active?: boolean;
    edit?: boolean;
    delete?: boolean;

    registerAt?: Date,
    updatedAt?: Date;
    createdAt?: Date;
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
    utility: number,
    priceCoinUnitBuyParallel: number
}
