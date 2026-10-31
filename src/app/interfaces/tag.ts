import { User } from "./user";

export interface Tag {
  _id?: string;
  name?: string;
  tag?: string | undefined;
  User?: User;
  checked?: boolean;
  
  updateAt?: string;
  createdAt?: string;
}
