import { PostAdCategory } from "./adCategory";
import { Bookmark } from "./bookmark";
import { CityZone } from "./cityZone";
import { Country } from "./country";
import { CountryState } from "./countryState";
import { PostMedia } from "./postMedia";
import { Site } from "./site";
import { StateCity } from "./stateCity";
import { Subscription } from "./subscription";
import { User } from "./user";


export interface Post {

    _id?: string;
    User?: User;
    Site?: Site;
    code?: string;
    title?: string;
    slug?: string;
    address?: string;
    postalCode?: string;
    zone?: string;
    description?: string;
    age?: number;
    gender?: string;
    plan?: number;
    planAt?: number;
    expirationDate?: string;
    publishedAt?: string;

    phonePrefix?: string;
    phone?: string;
    whatsapp?: string;
    telegram?: string;
    published?: boolean;
    publishedCount?: number;
    commentCount?: number;
    comments?: Comment[];
    link?: string;
    pined?: boolean;

    phoneClick?: number;
    whatsappClick?: number;
    telegramClick?: number;
    totalClick?: number;

    PostAdCategory?: PostAdCategory;
    Country?: Country;
    CountryState?: CountryState,
    StateCity?: StateCity;
    CityZone?: CityZone;
    PostMedia?: PostMedia[];
    Comment?: Comment[];
    tags?: [];

    Bookmark?: Bookmark;
    isBookmarked?: boolean;

    Subscription?: Subscription;
    isSubscribed?: boolean;
    currentSubscriptionDate?: any;

    likes?: number;
    updateAt?: string;
    createdAt?: string;

    credit?: number;
    isComment?: boolean;
    isPreviewMedia?: boolean;
    isProfile?: boolean;
    isDownload?: boolean;
    Download?: any;

    status?: string;
    typeView?: string;
    viewCounter?: number;
    price?: number;

    type?: string;

    videoLoaded?: boolean;
    showMenuDropdown?: boolean;
    currentIndex?: number;

    route?: string;
    currentRoute?: string;

    urlSeo?: string;

}
