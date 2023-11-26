import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Errors } from './Errors/Errors';
import { AxiosResponse } from 'axios';
import { map, firstValueFrom } from 'rxjs';
import { isJwtExpired } from 'jwt-check-expiration';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UserService {
  constructor(private readonly httpService: HttpService) {}

  makeUrl(endpoint: string, isAuth: boolean = false): string {
    const uri = `https://${process.env.SUBDOMAIN}.`;
    if (isAuth) return uri + 'amocrm.ru/' + endpoint;
    return uri + process.env.URL + '/' + endpoint;
  }

  async refreshToken(): Promise<string> {
    try {
      //reading paths to files access and r where tokens are
      const pRefresh = path.resolve(__dirname, '..', '..', 'r.txt');
      const pAccess = path.resolve(__dirname, '..', '..', 'access.txt');
      //reading token and if file is empty break method
      const token = fs.readFileSync(pRefresh).toString('utf-8');
      if (!token.length) return;
      const data = {
        client_id: process.env.INTEGRATION_ID,
        client_secret: process.env.SECRET_KEY,
        grant_type: 'refresh_token',
        refresh_token: token,
        redirect_uri: process.env.REDIRECT,
      };

      const tokens = await this.httpService
        .post(this.makeUrl('oauth2/access_token', true), data)
        .pipe(map((response: AxiosResponse) => response.data))
        .toPromise();

      //after request we clear this files and rewrite our tokens
      fs.truncateSync(pAccess);
      fs.truncateSync(pRefresh);
      fs.writeFileSync(pRefresh, tokens.refresh_token);
      fs.writeFileSync(pAccess, tokens.access_token);
      return tokens.access_token;
    } catch (e: any) {
      console.error(e.message);
      return '';
    }
  }

  readTokenAccess(): string | boolean {
    //typical reading access token from file
    const p = path.resolve(__dirname, '..', '..', 'access.txt');
    const data = fs.readFileSync(p);
    if (!data.length) return false;
    return data.toString('utf-8');
  }

  makeRequestConfig(): { headers: { Authorization } } {
    //make our code lower
    return {
      headers: {
        Authorization: `Bearer ${this.readTokenAccess()}`,
      },
    };
  }

  async createUser(
    email: string,
    phone: string,
    name: string,
  ): Promise<number> {
    const url = this.makeUrl('contacts');
    //this custom values are default phone and email fields
    const da = [
      {
        name,
        custom_fields_values: [
          {
            field_id: 46507,
            values: [
              {
                value: phone,
              },
            ],
          },
          {
            field_id: 46509,
            values: [
              {
                value: email,
              },
            ],
          },
        ],
      },
    ];
    console.log(da);
    //firstValueFrom make Observable type to promise to read data
    const {data} = await firstValueFrom(
      this.httpService.post(url, da, this.makeRequestConfig()),
    );
    return data._embedded.contacts[0].id;
  }

  async updateUser(
    phone: string,
    email: string,
    name: string,
    options: any,
    id: number,
  ) {
    try {
      const uri = this.makeUrl('contacts');
      const data = [
        {
          id,
          name,
          custom_fields_values: [
            {
              field_id: 46507,
              values: [
                {
                  value: phone,
                },
              ],
            },
            {
              field_id: 46509,
              values: [
                {
                  value: email,
                },
              ],
            },
          ],
        },
      ];
      const result = await firstValueFrom(
        this.httpService.patch(uri, data, options),
      );
      return result.data._embedded.contacts[0];
    } catch (e) {
      console.error(e);
    }
  }

  async findUserByEmail(email: string, options: any) {
    try {
      const uri = this.makeUrl(`contacts?query=${email}`);
      //we make get request to find user with this email
      const { data } = await firstValueFrom(this.httpService.get(uri, options));
      if (!data._embedded) return null; //case if user is empty
      return data._embedded.contacts[0];
    } catch (e) {
      console.error(e.message);
    }
  }

  async findUserByPhone(phone: string, options: any) {
    try {
      const uri = this.makeUrl(`contacts?query=${phone.replace('+', '')}`); //we don't need +
      const { data } = await firstValueFrom(this.httpService.get(uri, options));
      if (!data._embedded) return null;
      return data._embedded.contacts[0];
    } catch (e) {
      console.error(e.message);
    }
  }

  async findUser(
    email: string | null,
    phone: string | null,
    name: string | null,
  ): Promise<any> {
    try {
      if (!email && !phone) throw new Error(Errors.BAD_REQUEST); // Case then email and phone is empty
      let accessToken = this.readTokenAccess();
      if (!accessToken || isJwtExpired(accessToken)) {
        accessToken = await this.refreshToken();
      }
      const options = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };

      const findEmail = await this.findUserByEmail(email, options);
      const findPhone = await this.findUserByPhone(phone, options);
      let user = null;
      
      if (findEmail || findPhone) {
        const userID = findEmail ? findEmail.id : findPhone.id;
        //if we found user with this email or phone
        user = await this.updateUser(
          phone,
          email,
          name,
          options,
          userID, //if we does not have user with this email we use phone or use email if we have it
        );
      } else {
        //if user not found we create another one
        user = await this.createUser(email, phone, name);
        const uri = this.makeUrl('leads');
        const data = [
          {
            name: `Сделка контанка ${user}`,
            _embedded: {
              contacts: [
                {
                  id: user,
                },
              ],
            },
          },
        ];
        //we making new lead with fields name and link user_id to contacts
        await firstValueFrom(this.httpService.post(uri, data, options));
      }

      return user ? 'success' : 'refused';
    } catch (e: any) {
      console.error(e);
      return e.message;
    }
  }
}
