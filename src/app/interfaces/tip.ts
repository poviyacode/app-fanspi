import { User } from "./user";

export interface Tip {
    type?: string;
    typeContent: string;
    roomID?: string;
    post?: any;
    user?: User;
    LiveStreamId?: string;
}
