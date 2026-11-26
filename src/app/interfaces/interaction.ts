import { Site } from "./site";
import { User } from "./user";

export interface Interaction {
    Site: Site;
    User: User;
    type?: string;
    updateAt?: string;
    createdAt?: string;
}