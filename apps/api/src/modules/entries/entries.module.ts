import { Module } from '@nestjs/common';
import { EntriesController } from './entries.controller.js';
import { EntriesService } from './entries.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [EntriesController],
  providers: [EntriesService],
})
export class EntriesModule {}
