import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  adminUserFiltersSchema,
  toggleFlagSchema,
  type AdminUserFiltersDto,
  type ToggleFlagDto,
} from '@grow-logs/schemas';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/index.js';
import {
  AdminService,
  type AdminUserItem,
  type FlagToggleResult,
} from './admin.service.js';

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users — ADMIN only' })
  @ApiOkResponse({ description: 'Paginated user list returned' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  @ApiForbiddenResponse({ description: 'User is not an ADMIN' })
  async getUsers(
    @Query(new ZodValidationPipe(adminUserFiltersSchema))
    filters: AdminUserFiltersDto,
  ): Promise<{ data: AdminUserItem[]; meta: PaginationMeta }> {
    const { items, total } = await this.adminService.getUsers(filters);
    return {
      data: items,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  @Patch('feature-flags/:key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle a feature flag — ADMIN only' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['enabled'],
      properties: {
        enabled: { type: 'boolean', example: true },
      },
    },
  })
  @ApiOkResponse({ description: 'Flag updated and cache invalidated' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  @ApiForbiddenResponse({ description: 'User is not an ADMIN' })
  @ApiNotFoundResponse({ description: 'Feature flag key not found' })
  async toggleFlag(
    @Param('key') key: string,
    @Body(new ZodValidationPipe(toggleFlagSchema)) dto: ToggleFlagDto,
  ): Promise<{ data: FlagToggleResult; meta: object }> {
    const flag = await this.adminService.toggleFlag(key, dto.enabled);
    return { data: flag, meta: {} };
  }
}
