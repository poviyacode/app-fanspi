import { StateCity } from "./stateCity";

export interface Country {

    _id?: string;
    icon?: string;
    name? : string;
    slug?: string;
    code?: string;
    phonePrefix?: string;
    activeYuvinka?: boolean;
    updateAt?: string;
    createdAt?: string;
    Cities?: StateCity[]
}

