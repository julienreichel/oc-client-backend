import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IdGenerator } from '../../domain/services/id-generator';

@Injectable()
export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
