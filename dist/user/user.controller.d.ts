import { UserService } from './user.service';
import { UserParamsDTO } from './dto/Params/Params.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findUser(params: UserParamsDTO): Promise<any>;
}
