import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthController } from './adapters/http/health.controller';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [AppService],
})
export class AppModule {}
