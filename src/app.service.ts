import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { map, firstValueFrom } from 'rxjs';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}

  async refreshToken(code: string): Promise<string> {
    try {
      //reading paths to files access and r where tokens are
      const pRefresh = path.resolve(__dirname, '..', 'r.txt');
      const pAccess = path.resolve(__dirname, '..', 'access.txt');

      const data = {
        client_id: process.env.INTEGRATION_ID,
        client_secret: process.env.SECRET_KEY,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.REDIRECT,
      };

      const tokens = await this.httpService
        .post(
          `https://${process.env.SUBDOMAIN}.amocrm.ru/oauth2/access_token`,
          data,
        )
        .pipe(map((response: AxiosResponse) => response.data))
        .toPromise();

      //after request we clear this files and rewrite our tokens
      fs.truncateSync(pAccess);
      fs.truncateSync(pRefresh);
      fs.writeFileSync(pRefresh, tokens.refresh_token);
      fs.writeFileSync(pAccess, tokens.access_token);
      return "success";
    } catch (e: any) {
      console.error(e.message);
      return 'bad code';
    }
  }
}
