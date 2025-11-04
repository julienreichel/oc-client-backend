import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDocument {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  content!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  expiresIn?: number;
}
