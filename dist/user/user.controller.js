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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const Params_dto_1 = require("./dto/Params/Params.dto");
const Errors_1 = require("./Errors/Errors");
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async findUser(params) {
        try {
            const { email, phone, name } = params;
            const result = await this.userService.findUser(email, phone, name);
            return result.length ? result : 'no content';
        }
        catch (e) {
            if (e.message === Errors_1.Errors.BAD_REQUEST) {
                return new common_1.BadRequestException('Email or phone is empty!');
            }
            return new common_1.InternalServerErrorException();
        }
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('/'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Params_dto_1.UserParamsDTO]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findUser", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map