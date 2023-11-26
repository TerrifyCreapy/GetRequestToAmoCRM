import { HttpService } from '@nestjs/axios';
export declare class UserService {
    private readonly httpService;
    constructor(httpService: HttpService);
    makeUrl(endpoint: string, isAuth?: boolean): string;
    refreshToken(): Promise<string>;
    readTokenAccess(): string | boolean;
    makeRequestConfig(): {
        headers: {
            Authorization: any;
        };
    };
    createUser(email: string, phone: string, name: string): Promise<number>;
    updateUser(phone: string, email: string, name: string, options: any, id: number): Promise<any>;
    findUserByEmail(email: string, options: any): Promise<any>;
    findUserByPhone(phone: string, options: any): Promise<any>;
    findUser(email: string | null, phone: string | null, name: string | null): Promise<any>;
}
