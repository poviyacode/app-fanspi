import { StateCity } from "./stateCity";

export interface CityZone {

    _id?: string;
    name? : string;
    slug?: string;
    StateCity?: StateCity;
    updateAt?: string;
    createdAt?: string;

}

