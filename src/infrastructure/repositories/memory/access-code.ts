import { AccessCode } from '../../../domain/entities/access-code';
import { AccessCodeRepositoryPort } from '../../../domain/ports/access-code-repository.port';

export class AccessCodeRepository implements AccessCodeRepositoryPort {
  private accessCodes: Map<string, AccessCode> = new Map();

  save(accessCode: AccessCode): Promise<AccessCode> {
    this.accessCodes.set(accessCode.code, accessCode);
    return Promise.resolve(accessCode);
  }

  findByCode(code: string): Promise<AccessCode | null> {
    return Promise.resolve(this.accessCodes.get(code) || null);
  }

  async findAll(): Promise<AccessCode[]> {
    return Promise.resolve(Array.from(this.accessCodes.values()));
  }

  // Test helper methods
  clear(): void {
    this.accessCodes.clear();
  }

  count(): number {
    return this.accessCodes.size;
  }
}
