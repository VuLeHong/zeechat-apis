import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";



export type MessageDocument = Message & Document;

@Schema({ timestamps: true, collection: "messages" })
export class Message {
  @Prop({ type: Types.ObjectId, required: true })
  sender_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Types.ObjectId, required: true })
  chat_id: Types.ObjectId;

  @Prop({ type: String, default: false })
  type: string;

  @Prop({ type: Date})
  deleted_at: Date | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
