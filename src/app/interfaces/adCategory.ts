import { Country } from "./country";

export interface PostAdCategory {
    _id?: string;
    Country?: Country;
    icon?: string;
    name?: string;
    slug?: string;
    type?: string;
    active?: boolean;
    updateAt?: string;
    createdAt?: string;
}
