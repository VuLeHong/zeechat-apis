import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("No token provided");
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = verifyToken(token);
      req["user"] = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
