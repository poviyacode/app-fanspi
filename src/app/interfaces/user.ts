import { Subscription } from "./subscription";
import { Cam } from "./cam";
import { Country } from "./country";
import { Membership } from "./membership";
import { PostMedia } from "./postMedia";
import { SocialMedia } from "./socialMedia";
import { StateCity } from "./stateCity";
import { Tag } from "./tag";
import { UserCredit } from "./userCredit";
import { CreditCalculator } from "./transactionCredit";
import { Site } from "./site";
import { CountryState } from "./countryState";


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
    Membership?: Membership[];
    SocialMedia?: SocialMedia[];
    UserCredit?: UserCredit[];
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

    online?: boolean;
    onlineAt?: string;
    live?: boolean,
    videoCall?: boolean;
    videoCallAt?: string;
    streamingAt?: string;
    videoConferenceAt?: string;
    liveCapture?: any;
    liveStatus?: string,
    liveRoomId?: string;

    Subscription?: Subscription;
    Site?: Site;

    verified?: boolean;
    contentType?: string;
    createdAt?: string;

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
        ouput: number,
        input: number,
        current: number
    };

    stripeCustomer?: object;
}

export interface UserCurrent {
    Receiver?: string;
    User: User,
    UserCredit?: UserCredit,
    Subscription?: Subscription[],
    CreditCalculator?: CreditCalculator;
    countUnreadMessagesReceiver?: number;
    status?: string;
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
