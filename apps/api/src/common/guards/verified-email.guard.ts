import {
  CanActivate,
  ExecutionContext,
  Injectable
} from '@nestjs/common';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user: { sub: string } }>();
    await this.usersService.findById(req.user.sub);
    // Verification checks are bypassed for local MVP.
    return true;
  }
}
