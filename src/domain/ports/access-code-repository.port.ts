import { AccessCode } from '../entities/access-code.entity';

export interface AccessCodeRepositoryPort {
  save(accessCode: AccessCode): Promise<AccessCode>;
  findByCode(code: string): Promise<AccessCode | null>;
}
