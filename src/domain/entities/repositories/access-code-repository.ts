import { AccessCode } from '../access-code';

export interface AccessCodeRepository {
  save(accessCode: AccessCode): Promise<AccessCode>;
  findByCode(code: string): Promise<AccessCode | null>;
  findAll(): Promise<AccessCode[]>;
}
