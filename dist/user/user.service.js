"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const Errors_1 = require("./Errors/Errors");
const rxjs_1 = require("rxjs");
const jwt_check_expiration_1 = require("jwt-check-expiration");
const path = require("path");
const fs = require("fs");
let UserService = class UserService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    makeUrl(endpoint, isAuth = false) {
        const uri = `https://${process.env.SUBDOMAIN}.`;
        if (isAuth)
            return uri + 'amocrm.ru/' + endpoint;
        return uri + process.env.URL + '/' + endpoint;
    }
    async refreshToken() {
        try {
            const pRefresh = path.resolve(__dirname, '..', '..', 'r.txt');
            const pAccess = path.resolve(__dirname, '..', '..', 'access.txt');
            const token = fs.readFileSync(pRefresh).toString('utf-8');
            if (!token.length)
                return;
            const data = {
                client_id: process.env.INTEGRATION_ID,
                client_secret: process.env.SECRET_KEY,
                grant_type: 'refresh_token',
                refresh_token: token,
                redirect_uri: process.env.REDIRECT,
            };
            const tokens = await this.httpService
                .post(this.makeUrl('oauth2/access_token', true), data)
                .pipe((0, rxjs_1.map)((response) => response.data))
                .toPromise();
            fs.truncateSync(pAccess);
            fs.truncateSync(pRefresh);
            fs.writeFileSync(pRefresh, tokens.refresh_token);
            fs.writeFileSync(pAccess, tokens.access_token);
            return tokens.access_token;
        }
        catch (e) {
            console.error(e.message);
            return '';
        }
    }
    readTokenAccess() {
        const p = path.resolve(__dirname, '..', '..', 'access.txt');
        const data = fs.readFileSync(p);
        if (!data.length)
            return false;
        return data.toString('utf-8');
    }
    makeRequestConfig() {
        return {
            headers: {
                Authorization: `Bearer ${this.readTokenAccess()}`,
            },
        };
    }
    async createUser(email, phone, name) {
        const url = this.makeUrl('contacts');
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
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, da, this.makeRequestConfig()));
        return data._embedded.contacts[0].id;
    }
    async updateUser(phone, email, name, options, id) {
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
            const result = await (0, rxjs_1.firstValueFrom)(this.httpService.patch(uri, data, options));
            return result.data._embedded.contacts[0];
        }
        catch (e) {
            console.error(e);
        }
    }
    async findUserByEmail(email, options) {
        try {
            const uri = this.makeUrl(`contacts?query=${email}`);
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(uri, options));
            if (!data._embedded)
                return null;
            return data._embedded.contacts[0];
        }
        catch (e) {
            console.error(e.message);
        }
    }
    async findUserByPhone(phone, options) {
        try {
            const uri = this.makeUrl(`contacts?query=${phone.replace('+', '')}`);
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(uri, options));
            if (!data._embedded)
                return null;
            return data._embedded.contacts[0];
        }
        catch (e) {
            console.error(e.message);
        }
    }
    async findUser(email, phone, name) {
        try {
            if (!email && !phone)
                throw new Error(Errors_1.Errors.BAD_REQUEST);
            let accessToken = this.readTokenAccess();
            if (!accessToken || (0, jwt_check_expiration_1.isJwtExpired)(accessToken)) {
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
                user = await this.updateUser(phone, email, name, options, userID);
            }
            else {
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
                await (0, rxjs_1.firstValueFrom)(this.httpService.post(uri, data, options));
            }
            return user ? 'success' : 'refused';
        }
        catch (e) {
            console.error(e);
            return e.message;
        }
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], UserService);
//# sourceMappingURL=user.service.js.map