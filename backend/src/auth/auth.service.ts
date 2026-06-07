import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { Branch } from '../branches/schemas/branch.schema';
import { UserRole } from '../common/enums/user.enums';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from './interfaces/auth-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User, UserDocument } from './schemas/user.schema';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Branch.name) private readonly branchModel: Model<Branch>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    if (dto.branch) {
      await this.ensureBranchExists(dto.branch);
    }

    const password = await this.hashPassword(dto.password);
    const user = await this.userModel.create({
      email,
      password,
      name: dto.name.trim(),
      role: UserRole.EMPLOYEE,
      branch: dto.branch ? new Types.ObjectId(dto.branch) : undefined,
    });

    const safeUser = await this.validateUser(user._id.toString());
    return {
      message: 'Регистрация успешна',
      user: safeUser,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .populate('branch', 'name address phone email workingHours')
      .exec();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const safeUser = this.toAuthUser(user);
    const access_token = this.createToken(user);

    return { access_token, user: safeUser };
  }

  async validateUser(userId: string): Promise<AuthUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const user = await this.userModel
      .findById(userId)
      .populate('branch', 'name address phone email workingHours')
      .exec();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Пользователь не найден или деактивирован');
    }

    return this.toAuthUser(user);
  }

  async getProfile(userId: string) {
    const user = await this.validateUser(userId);
    return { user };
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  private createToken(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private async ensureBranchExists(branchId: string): Promise<void> {
    if (!Types.ObjectId.isValid(branchId)) {
      throw new NotFoundException('Филиал не найден');
    }
    const branch = await this.branchModel.findById(branchId).exec();
    if (!branch || !branch.isActive) {
      throw new NotFoundException('Филиал не найден');
    }
  }

  private toAuthUser(user: UserDocument): AuthUser {
    const branch = user.branch as unknown as
      | { _id: Types.ObjectId }
      | Types.ObjectId
      | undefined;

    let branchId: string | undefined;
    if (branch instanceof Types.ObjectId) {
      branchId = branch.toString();
    } else if (branch && typeof branch === 'object' && '_id' in branch) {
      branchId = branch._id.toString();
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      branch: branchId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
