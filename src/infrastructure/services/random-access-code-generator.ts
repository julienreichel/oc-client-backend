import { Injectable } from '@nestjs/common';
import type { AccessCodeGenerator } from '../../domain/services/access-code-generator';

@Injectable()
export class RandomAccessCodeGenerator implements AccessCodeGenerator {
  private static readonly ACCESS_CODE_LENGTH = 8;
  private static readonly CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding ambiguous chars

  generate(): string {
    let result = '';
    for (let i = 0; i < RandomAccessCodeGenerator.ACCESS_CODE_LENGTH; i++) {
      const randomIndex = Math.floor(
        Math.random() * RandomAccessCodeGenerator.CHARSET.length,
      );
      result += RandomAccessCodeGenerator.CHARSET[randomIndex];
    }
    return result;
  }
}
