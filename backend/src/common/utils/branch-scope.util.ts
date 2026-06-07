import { Types } from 'mongoose';
import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { UserRole } from '../enums/user.enums';

/** Филиал сотрудника для ограничения доступа (как на дашборде). */
export function getEmployeeBranchId(user?: AuthUser): string | undefined {
  if (user?.role === UserRole.EMPLOYEE && user.branch) {
    return user.branch;
  }
  return undefined;
}

export function employeeBranchObjectId(
  user?: AuthUser,
): Types.ObjectId | undefined {
  const id = getEmployeeBranchId(user);
  return id ? new Types.ObjectId(id) : undefined;
}
