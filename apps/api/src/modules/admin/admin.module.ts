import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module.js';

@Module({
  imports: [PrismaModule, FeatureFlagsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
