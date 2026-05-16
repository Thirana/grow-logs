import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  createEntrySchema,
  updateEntrySchema,
  entryFiltersSchema,
  summaryQuerySchema,
  type CreateEntryDto,
  type UpdateEntryDto,
  type EntryFiltersDto,
  type SummaryQueryDto,
} from '@grow-logs/schemas';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { ZodValidationPipe } from '../../common/pipes/index.js';
import {
  EntriesService,
  type EntryResponse,
  type SummaryResponse,
} from './entries.service.js';

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Entry CRUD endpoints under /api/v1/entries.
 * All routes require a valid JWT — JwtAuthGuard is applied at the class level.
 *
 * IMPORTANT: If adding GET /entries/summary (Step 24), place it BEFORE the /:id
 * route in this file. NestJS matches routes in declaration order, so 'summary'
 * would be treated as a UUID param if it comes after /:id.
 */
@ApiTags('entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'entries', version: '1' })
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List entries with optional filters and pagination',
  })
  @ApiOkResponse({ description: 'Paginated entry list returned' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(entryFiltersSchema)) filters: EntryFiltersDto,
  ): Promise<{ data: EntryResponse[]; meta: PaginationMeta }> {
    const { items, total } = await this.entriesService.findAll(
      user.userId,
      filters,
    );
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new log entry' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'text', 'categoryId'],
      properties: {
        type: { type: 'string', enum: ['WORK', 'LEARNING'], example: 'WORK' },
        text: {
          type: 'string',
          minLength: 10,
          maxLength: 1000,
          example: 'Implemented the EntriesModule CRUD endpoints in NestJS.',
        },
        categoryId: {
          type: 'string',
          format: 'uuid',
          example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        },
        subcategoryId: {
          type: 'string',
          format: 'uuid',
          example: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        },
        productivityScore: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          example: 8,
        },
        entryDate: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          example: '2024-01-15',
          description:
            'Defaults to today (UTC) if omitted. Future dates are rejected.',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Entry created' })
  @ApiNotFoundResponse({ description: 'Category or subcategory not found' })
  @ApiUnprocessableEntityResponse({
    description:
      'Future entry date, completed category/subcategory, or free-tier daily limit reached',
  })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createEntrySchema)) dto: CreateEntryDto,
  ): Promise<{ data: EntryResponse; meta: object }> {
    const entry = await this.entriesService.create(
      user.userId,
      user.subscriptionStatus,
      dto,
    );
    return { data: entry, meta: {} };
  }

  @Get('summary')
  @ApiOperation({
    summary:
      'Dashboard summary: totals, streaks, category breakdown, daily activity, weekly trend',
  })
  @ApiOkResponse({ description: 'Summary returned' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(summaryQuerySchema)) query: SummaryQueryDto,
  ): Promise<{ data: SummaryResponse; meta: object }> {
    const summary = await this.entriesService.getSummary(user.userId, query);
    return { data: summary, meta: {} };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single entry by ID' })
  @ApiOkResponse({ description: 'Entry returned' })
  @ApiNotFoundResponse({ description: 'Entry not found or not owned by user' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') entryId: string,
  ): Promise<{ data: EntryResponse; meta: object }> {
    const entry = await this.entriesService.findOne(user.userId, entryId);
    return { data: entry, meta: {} };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an entry — any field is optional' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['WORK', 'LEARNING'] },
        text: { type: 'string', minLength: 10, maxLength: 1000 },
        categoryId: { type: 'string', format: 'uuid' },
        subcategoryId: { type: 'string', format: 'uuid' },
        productivityScore: { type: 'integer', minimum: 1, maximum: 10 },
        entryDate: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'Future dates are rejected.',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Entry updated' })
  @ApiNotFoundResponse({
    description: 'Entry, category, or subcategory not found',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Future entry date, reassignment to completed category/subcategory, or subcategory mismatch',
  })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') entryId: string,
    @Body(new ZodValidationPipe(updateEntrySchema)) dto: UpdateEntryDto,
  ): Promise<{ data: EntryResponse; meta: object }> {
    const entry = await this.entriesService.update(user.userId, entryId, dto);
    return { data: entry, meta: {} };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an entry permanently' })
  @ApiNoContentResponse({ description: 'Entry deleted' })
  @ApiNotFoundResponse({ description: 'Entry not found or not owned by user' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') entryId: string,
  ): Promise<void> {
    await this.entriesService.delete(user.userId, entryId);
  }
}
