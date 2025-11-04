import { AccessCode } from '../../../domain/entities/access-code';
import { AccessCodeRepository as AccessCodeRepositoryInterface } from '../../../domain/entities/repositories/access-code-repository';

export class AccessCodeRepository implements AccessCodeRepositoryInterface {
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
