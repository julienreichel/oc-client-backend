import { Injectable } from '@nestjs/common';
import type { Clock } from '../../domain/services/clock';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
