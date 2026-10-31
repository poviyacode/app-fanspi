import { Site } from "./site";
import { User } from "./user";

export interface Token {
  _id?: string;
  Site?: Site;
  User?: User;
  category?: string;
  type?: string;
  code?: string;
  token?: string;
  used?: boolean;
  expiresAt?: Date;
  email: string

  updateAt?: string;
  createdAt?: string;
}



