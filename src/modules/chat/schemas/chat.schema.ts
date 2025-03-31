import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";



export type ChatDocument = Chat & Document;

@Schema({ timestamps: true, collection: "chats" })
export class Chat {
  @Prop({ type: Types.ObjectId, required: true })
  owner_id: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], required: true })
  members: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  is_group: Boolean;

  @Prop({ type: Boolean, default: false })
  is_strict?: Boolean;

  @Prop({ type: String })
  groupName?: string;

  @Prop({ type: Date })
  deleted_at: Date | null;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
