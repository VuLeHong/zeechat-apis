import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsEmail, IsDateString, IsArray, IsBoolean, IsString } from "class-validator";

export class CreateChatDto {

  @ApiProperty({ required: true })
  @IsArray()
  @IsNotEmpty()
  members: string[];

  @ApiProperty({ required: false })
  @IsBoolean()
  is_group?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  groupName?: string;
}
