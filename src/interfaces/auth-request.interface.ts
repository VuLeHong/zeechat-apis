import { Request } from "express";
import { Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  userId: string;
  email: string;
  username: string;
}

export interface AuthRequest extends Request {
  user: IUser;
}
