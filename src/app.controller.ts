import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  async getTokensByAuth(@Query('code') code: string): Promise<any> {
    try {
      return await this.appService.refreshToken(code);
    } catch (e: any) {
      console.log(e.message);
      return "bad code";
    }
  }
}
