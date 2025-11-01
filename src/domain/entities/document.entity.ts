export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  expiresAt?: Date;
}

export class DocumentEntity implements Document {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly expiresAt?: Date,
  ) {}

  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  static create(params: {
    title: string;
    content: string;
    expiresAt?: Date;
  }): DocumentEntity {
    return new DocumentEntity(
      crypto.randomUUID(),
      params.title,
      params.content,
      new Date(),
      params.expiresAt,
    );
  }
}
