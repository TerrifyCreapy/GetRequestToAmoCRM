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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const path = require("path");
const fs = require("fs");
let AppService = class AppService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async refreshToken(code) {
        try {
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
                .post(`https://${process.env.SUBDOMAIN}.amocrm.ru/oauth2/access_token`, data)
                .pipe((0, rxjs_1.map)((response) => response.data))
                .toPromise();
            fs.truncateSync(pAccess);
            fs.truncateSync(pRefresh);
            fs.writeFileSync(pRefresh, tokens.refresh_token);
            fs.writeFileSync(pAccess, tokens.access_token);
            return "success";
        }
        catch (e) {
            console.error(e.message);
            return 'bad code';
        }
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], AppService);
//# sourceMappingURL=app.service.js.map