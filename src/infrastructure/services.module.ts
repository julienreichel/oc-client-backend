import { Module } from '@nestjs/common';
import { SystemClock } from './services/system-clock';
import { UuidIdGenerator } from './services/uuid-id-generator';
import { RandomAccessCodeGenerator } from './services/random-access-code-generator';

@Module({
  providers: [
    {
      provide: 'Clock',
      useClass: SystemClock,
    },
    {
      provide: 'IdGenerator',
      useClass: UuidIdGenerator,
    },
    {
      provide: 'AccessCodeGenerator',
      useClass: RandomAccessCodeGenerator,
    },
  ],
  exports: ['Clock', 'IdGenerator', 'AccessCodeGenerator'],
})
export class ServicesModule {}
