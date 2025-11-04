import { IdGeneratorPort } from '../../domain/ports/id-generator.port';

export class FakeIdGenerator implements IdGeneratorPort {
  private sequence = 1;

  generate(): string {
    const id = `test-id-${this.sequence.toString().padStart(3, '0')}`;
    this.sequence++;
    return id;
  }

  reset(): void {
    this.sequence = 1;
  }
}
