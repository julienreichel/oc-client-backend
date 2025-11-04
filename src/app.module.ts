import { Module } from '@nestjs/common';
import { AppController } from './presentation/controllers/app.controller';
import { AppService } from './app.service';
import { HealthController } from './adapters/http/health.controller';

@Module({
  imports: [],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
