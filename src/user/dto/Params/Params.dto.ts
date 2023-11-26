import { IsNotEmpty } from 'class-validator';

export class UserParamsDTO {
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  phone: string;
  @IsNotEmpty()
  name: string;
}