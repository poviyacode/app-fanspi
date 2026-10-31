import { Country } from "./country";
import { CountryState } from "./countryState";


export interface StateCity {

    _id?: string;
    name? : string;
    slug?: string;
    Country?: Country;
    CountryState?: CountryState;
    updateAt?: string;
    createdAt?: string;

}

