export class Document {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly content: string,
    public readonly createdAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Document id cannot be empty');
    }

    if (!this.title || this.title.trim() === '') {
      throw new Error('Document title cannot be empty');
    }

    if (!this.content || this.content.trim() === '') {
      throw new Error('Document content cannot be empty');
    }

    if (!(this.createdAt instanceof Date) || isNaN(this.createdAt.getTime())) {
      throw new Error('Document createdAt must be a valid date');
    }
  }

  static create(
    id: string,
    title: string,
    content: string,
    createdAt: Date,
  ): Document {
    return new Document(id, title, content, createdAt);
  }
}
