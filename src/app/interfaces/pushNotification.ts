import { Site } from "./site";
import { User } from "./user";

export interface PushNotification {
    _id?: string;
    Site?: Site;

    User?: User;

    token?: object;
    browser?: string;
    browserId?: string;
    deviceType?: string;
    ipAddress?: string;
    os?: string;

    status?: string;

    active?: boolean;
    edit?: boolean;
    updateAt?: string;
    createdAt?: string;
}