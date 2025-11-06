export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AccessCodeExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessCodeExpiredError';
  }
}
