import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";



export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({type: Boolean, default: false })
  isOnline: boolean;

  @Prop({ type: Types.ObjectId, required: true })
  friend_ids: Types.ObjectId[];

  @Prop({ type: Date, required: false })
  deleted_at: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
