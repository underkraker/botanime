import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { User } from "./entities/user.entity";
import { RefreshSession } from "./entities/refresh-session.entity";
import { AccessTokenPayload, RefreshTokenPayload } from "./types/jwt-payload.types";
import { UserRole } from "./types/user-role.type";

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
  };
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshSession)
    private readonly refreshSessionRepository: Repository<RefreshSession>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const adminEmail = this.configService.get<string>("ADMIN_EMAIL", "").toLowerCase();
    const role: UserRole = adminEmail && adminEmail === dto.email.toLowerCase() ? "admin" : "user";

    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      displayName: dto.displayName,
      role
    });

    const saved = await this.userRepository.save(user);
    return this.issueTokens(saved);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET", "change-me-refresh")
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }

    const session = await this.refreshSessionRepository.findOne({ where: { id: payload.sid } });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Refresh session is invalid");
    }

    const tokenMatch = await bcrypt.compare(refreshToken, session.tokenHash);
    if (!tokenMatch) {
      throw new UnauthorizedException("Refresh session mismatch");
    }

    session.revokedAt = new Date();
    await this.refreshSessionRepository.save(session);

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.issueTokens(user);
  }

  async me(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt
    };
  }

  private async issueTokens(user: User): Promise<AuthResponse> {
    const refreshSessionId = randomUUID();
    const accessExpiresInMinutes = Number(
      this.configService.get<string>("JWT_ACCESS_EXPIRES_MINUTES", "15")
    );
    const refreshExpiresInDays = Number(
      this.configService.get<string>("JWT_REFRESH_EXPIRES_DAYS", "14")
    );

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: "access"
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      sid: refreshSessionId,
      type: "refresh"
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET", "change-me-access"),
      expiresIn: accessExpiresInMinutes * 60
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET", "change-me-refresh"),
      expiresIn: refreshExpiresInDays * 24 * 60 * 60
    });

    const tokenHash = await bcrypt.hash(refreshToken, 12);
    const session = this.refreshSessionRepository.create({
      id: refreshSessionId,
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + refreshExpiresInDays * 24 * 60 * 60 * 1000),
      revokedAt: null
    });
    await this.refreshSessionRepository.save(session);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    };
  }
}
