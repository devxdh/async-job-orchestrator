import type { JwtPayload } from "jsonwebtoken";

export interface MyToken extends JwtPayload {
    userId: string,
    role: 'admin' | 'worker';
}