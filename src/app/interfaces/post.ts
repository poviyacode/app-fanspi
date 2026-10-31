import { PostAdCategory } from "./adCategory";
import { CityZone } from "./cityZone";
import { Country } from "./country";
import { PostMedia } from "./postMedia";
import { StateCity } from "./stateCity";
import { Subscription } from "./subscription";
import { User } from "./user";


export interface  Post {

    _id?: string;
    User?: User;

    code?: string;
    title? : string;
    slug?: string;
    address?: string;
    postalCode?: string;
    zone?: string;
    description?: string;
    age?: string;
    plan?: number;
    planAt?: number;
    expirationDate?: string;
    publishedAt?: string;

    phonePrefix?: string;
    phone?: string;
    whatsapp?: boolean;
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
    StateCity?: StateCity;
    CityZone?: CityZone;
    PostMedia?: PostMedia[];
    Comment?: Comment[];
    tags?: [];
    Bookmark?: User;
    likes?: number;
    updateAt?: string;
    createdAt?: string;

    credit?: number;
    comment?: boolean;
    previewMedia?: boolean;

    status?: string;
    typeView?: string;
    price?: number;

    type?: string;

    videoLoaded?: boolean;
    showMenuDropdown?: boolean;
    currentIndex?: number;
    Subscription?: Subscription;
}
