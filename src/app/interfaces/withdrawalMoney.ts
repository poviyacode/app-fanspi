import { Money } from "./money";
import { Site } from "./site";
import { TransactionCredit } from "./transactionCredit";
import { User } from "./user";

export interface WithdrawalMoney {

    _id?: string;
    code?: string;
    User? : User;
    UserAdm?: User;
    Site?: Site;
    TransactionCredit?: TransactionCredit[];
    Money?: Money;
    type?: string;
    amountRequest?: number;
    amountWithdrawn?: number;
    amountTotal?: number;
    transactions?: object;
    note?: string;
    status?: string;

    updateAt?: string;
    createdAt?: string;
}
