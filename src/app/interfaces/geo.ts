import { Country } from "./country";
import { StateCity } from "./stateCity";
import { User } from "./user";

export interface Geo {
    Country: Country;
    StateCity: StateCity;
    User: User;
    updateAt?: string;
    createdAt?: string;
}