import type { JwtPayload } from "jsonwebtoken";

export interface MyToken extends JwtPayload {
    id: string,
    role: 'admin' | 'worker';
}