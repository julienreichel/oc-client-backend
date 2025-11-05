import { Injectable, Logger } from '@nestjs/common';
import { AppConfig, ConfigValidationResult } from './app-config';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly config: AppConfig;

  constructor() {
    this.config = new AppConfig();
    this.validateConfig();
  }

  get database(): { url?: string; hasDatabase: boolean } {
    return {
      url: this.config.DATABASE_URL,
      hasDatabase: this.config.hasDatabase(),
    };
  }

  get environment(): {
    nodeEnv: string;
    isProduction: boolean;
    isDevelopment: boolean;
  } {
    return {
      nodeEnv: this.config.NODE_ENV,
      isProduction: this.config.isProduction(),
      isDevelopment: this.config.isDevelopment(),
    };
  }

  get server(): { port: string } {
    return {
      port: this.config.PORT,
    };
  }

  private validateConfig(): void {
    const result: ConfigValidationResult = this.config.validate();

    if (!result.isValid) {
      const errorMessage = `Configuration validation failed: ${result.errors.join(', ')}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    this.logger.log(
      `Configuration validated for ${this.config.NODE_ENV} environment`,
    );

    if (this.config.isDevelopment() && !this.config.hasDatabase()) {
      this.logger.warn(
        'Running in development mode without database - unit tests only',
      );
    }
  }
}
