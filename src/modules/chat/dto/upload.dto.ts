import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UploadDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  sender_id: string;
}
