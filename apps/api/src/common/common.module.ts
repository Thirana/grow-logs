import { Module } from '@nestjs/common';
import { ZodValidationPipe } from './pipes/index.js';

@Module({
  providers: [ZodValidationPipe],
  exports: [ZodValidationPipe],
})
export class CommonModule {}
