export interface AccessCode {
  code: string;
  documentId: string;
  createdAt: Date;
  expiresAt?: Date;
}

export class AccessCodeEntity implements AccessCode {
  constructor(
    public readonly code: string,
    public readonly documentId: string,
    public readonly createdAt: Date,
    public readonly expiresAt?: Date,
  ) {}

  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  static create(documentId: string, expiresAt?: Date): AccessCodeEntity {
    return new AccessCodeEntity(
      this.generateCode(),
      documentId,
      new Date(),
      expiresAt,
    );
  }

  private static generateCode(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
