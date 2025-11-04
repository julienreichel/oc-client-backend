import { AccessCodeGeneratorPort } from '../../domain/ports/access-code-generator.port';

export class FakeAccessCodeGenerator implements AccessCodeGeneratorPort {
  private sequence = 1;
  private forcedCodes: string[] = [];

  generate(): string {
    if (this.forcedCodes.length > 0) {
      return this.forcedCodes.shift()!;
    }

    const code = `AC${this.sequence.toString().padStart(6, '0')}`;
    this.sequence++;
    return code;
  }

  reset(): void {
    this.sequence = 1;
    this.forcedCodes = [];
  }

  // Test helper to simulate code collision scenarios
  forceNextCodes(codes: string[]): void {
    this.forcedCodes = [...codes];
  }
}
