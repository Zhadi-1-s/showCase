import { UserRole } from '../../common/enums/user.enums';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  branch?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
