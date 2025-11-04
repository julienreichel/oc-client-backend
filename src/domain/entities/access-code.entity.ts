export class AccessCode {
  constructor(
    public readonly code: string,
    public readonly documentId: string,
    public readonly expiresAt: Date | null,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.code || this.code.trim() === '') {
      throw new Error('AccessCode code cannot be empty');
    }

    if (!this.documentId || this.documentId.trim() === '') {
      throw new Error('AccessCode documentId cannot be empty');
    }

    if (
      this.expiresAt !== null &&
      (!(this.expiresAt instanceof Date) || isNaN(this.expiresAt.getTime()))
    ) {
      throw new Error('AccessCode expiresAt must be a valid date or null');
    }
  }

  isExpired(currentDate: Date): boolean {
    if (this.expiresAt === null) {
      return false;
    }
    return currentDate > this.expiresAt;
  }

  static create(
    code: string,
    documentId: string,
    expiresAt: Date | null,
  ): AccessCode {
    return new AccessCode(code, documentId, expiresAt);
  }
}
