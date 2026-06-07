import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Branch } from '../../branches/schemas/branch.schema';
import { USER_ROLES, UserRole } from '../../common/enums/user.enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ trim: true })
  name?: string;

  @Prop({ required: true, enum: USER_ROLES, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: Branch.name })
  branch?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
