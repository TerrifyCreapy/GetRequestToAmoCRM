import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserParamsDTO } from './dto/Params/Params.dto';
import { Errors } from './Errors/Errors';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  async findUser(@Query() params: UserParamsDTO): Promise<any> {
    try {
      const { email, phone, name } = params; //destruct our params
      const result = await this.userService.findUser(email, phone, name);

      return result.length ? result : 'no content';
    } catch (e: any) {
      if (e.message === Errors.BAD_REQUEST) {
        return new BadRequestException('Email or phone is empty!');
      }
      return new InternalServerErrorException();
    }
  }
}
