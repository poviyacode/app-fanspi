import { Chat } from "./chat";
import { PostMedia } from "./postMedia";
import { User } from "./user";

export interface Message {
    _id?: string;
    id?: any;
    code?: string;
    Chat?: any;
    idChat?: string;
    Sender?: any;
    Receiver?: any;
    PostMedia?: PostMedia[];
    typeView?: string;
    credit?: number;
    previewMedia?: boolean;
    message?: string;
    status?: string;
    received?: boolean;
    updateAt?: string;
    createdAt?: string;

    Reply?: Message;
    read?: boolean;
    type?: string;
}

export interface ReplyMessage {
    _id?: string;
    id?: string;
    message?: string;
    PostMedia?: PostMedia[];
    createdAt?: string;
    type?: string;
}
