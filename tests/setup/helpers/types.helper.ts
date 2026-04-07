export type RoleType = 'worker' | 'admin';

export type UserType = {
    id: string;
    email: string;
    role: RoleType;
};

export type AuthHeaderType = {
    Authorization: string
}