import { Subscription } from "./subscription";
import { Cam } from "./cam";
import { Country } from "./country";
import { Membership } from "./membership";
import { PostMedia } from "./postMedia";
import { SocialMedia } from "./socialMedia";
import { StateCity } from "./stateCity";
import { Tag } from "./tag";
import { CreditCalculator, UserCredit } from "./transactionCredit";
import { Site } from "./site";
import { CountryState } from "./countryState";
import { PushNotification } from "./pushNotification";

export enum UserRole {
    CREATOR = 'CREATOR',
    CLIENT = 'CLIENT',
    HOME = 'HOME',
    ADMIN = 'ADMIN',
    CASHIER = 'CASHIER',
    FINANCE = 'FINANCE', // <--- NUEVO: Ideal para gestión de pagos y ganancias
    SUPPORT = 'SUPPORT', // <--- NUEVO: Ideal si también da asistencia/soporte a usuarios
}

export enum StatusUser {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    DELETED = 'DELETED',
}

export interface AuthResponse {
    ok: boolean;
    data: {
        user?: User;
        access_token?: string;
    },
    message?: string;
}

export interface User {
    _id?: string;
    slug?: string;
    name?: string;
    lastname?: string;
    email?: string;
    emailVerified?: boolean;
    alias?: string;
    username?: string;
    age?: number;
    gender?: string;
    phonePrefix?: string;
    phone?: string;
    city?: string;
    address?: string;
    postalCode?: string;
    Country?: Country;
    CountryState?: CountryState;
    CountryAd?: Country;
    StateCity?: StateCity;
    bio?: string;
    webPage?: string;
    Cover?: PostMedia[];
    Profile?: PostMedia[];
    Membership?: any;
    SocialMedia?: SocialMedia[];
    Tag?: Tag[];
    Cam?: Cam;
    camStatus?: boolean;
    camRomId?: string;
    view?: number;
    viewCurrent?: number;
    viewDateCurrent?: string;
    viewdAt?: string;
    transmissionType?: string;
    setting?: {
        telegramPostOffset: number
    };

    personalReviewingAt?: string;
    personalVerifiedAt?: string;

    password?: string;

    checked?: boolean;
    active?: boolean;
    status?: string;
    statusPersonal?: string;

    //event user
    online?: boolean;
    onlineAt?: string;
    live?: boolean,
    videoCall?: boolean;
    videoCallAt?: string;
    streamingAt?: string;
    videoConferenceAt?: string;
    LiveStreamId?: string;
    liveCapture?: any;
    liveStatus?: string,
    liveRoomId?: string;
    liveDescription?: string;
    liveRole?: string;

    Subscription?: Subscription;
    Site?: Site;

    type?: string;
    roles?: UserRole[];

    verified?: boolean;
    contentType?: string;
    createdAt?: string;
    rentalGirlfriend?: boolean;

    countPosts?: {
        postsActiveCount?: number,
        postAdAactiveCount?: number,
        postImagesActiveCount?: number,
        postVideosActiveCount?: number,
        postAdImagesActiveCount?: number,
        postAdVideosActiveCount?: number,
        totalPostMediaActiveCount?: number,
        totalPostMediaAdActiveCount?: number
    },
    countUnreadMessages?: number;
    countCredit?: {
        buy: number,
        output: number,
        input: number,
        current: number
    };

    creditAmountDownload?: number;

    _loaded?: boolean;
}

export interface UserVideoCallRequest {
    roomID?: string;
    chatID?: string;
    videoCallID?: string;
    Caller?: User,
    Callee?: User,
    decision?: string;
    tip?: boolean;
}

export interface UserVisit {
    User?: User;
    active: boolean;
    SiteMain?: Site;
}

export interface UserCurrent {
    Receiver?: string;
    User?: User;
    UserCredit?: UserCredit;
    Subscription?: Subscription[];
    CreditCalculator?: CreditCalculator;
    countUnreadMessagesReceiver?: number;
    pushNotification?: ResPushNotification;
    accountBalance?: AccountBalance;
    status?: string;
    permissions?: UserPermissions;
}

export interface ResPushNotification {
    status: boolean;
    web: PushNotification;
    telegram: PushNotification;
}

export interface AccountBalance {
    income: number;
    withdrawalMoneyAccept: number;
    withdrawalMoneyPending: number;
    withdrawalMoneyProcessing: number;
    withdrawnMoney: number;
    sendMoneyAccept: number;
    sendMoneyPending: number;
    sendMoney: number;
    availableMoney: number;
    withdrawal: number;
    balance: number;
}

export interface UserPermissions {
    canSendMessages?: boolean;
    canMakeVideoCalls?: boolean;
    canGoLive?: boolean;
    canCreatePosts?: boolean;
    canBuyCredit?: boolean;
}
