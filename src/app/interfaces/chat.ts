import { Message } from "./message";
import { TransactionCredit } from "./transactionCredit";
import { User } from "./user";

export enum TypeChat {
  PERSONAL = 'PERSONAL',
  P2P = 'P2P',
}

export interface Chat {
  _id?: string;
  id?: string;
  Sender?: any;
  Receiver?: any;
  User?: User;
  TransactionCredit?: TransactionCredit;
  type?: TypeChat;
  LastMessageSender?: User,
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageRead?: boolean;
  lastMessageImage?: boolean;
  lastMessageType?: string;

  LastMessage?: Message | null;
  unreadCount?: number | 0;

  tip?: boolean;
}
