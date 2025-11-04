import { AccessCode } from '../entities/access-code';

export interface AccessCodeRepositoryPort {
  save(accessCode: AccessCode): Promise<AccessCode>;
  findByCode(code: string): Promise<AccessCode | null>;
  findAll(): Promise<AccessCode[]>;
}
