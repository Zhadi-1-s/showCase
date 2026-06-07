import { UserRole } from '../../common/enums/user.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
