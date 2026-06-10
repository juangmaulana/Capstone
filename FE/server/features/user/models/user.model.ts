import { Role } from './role.model.js';

export class User {
  constructor(
    public id: number,
    public role: Role,
    public name: string,
    public email: string,
    public country: string | null,
    public lastLoginAt: Date | null | undefined,
    public createdAt: Date,
    public updatedAt: Date,
  ){
  }
};
