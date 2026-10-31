import { Message } from "./message";
import { User } from "./user";

export interface Chat {
  _id?: string;
  id?: string;
  Sender?: any;
  Receiver?: any;
  User?: User;
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
