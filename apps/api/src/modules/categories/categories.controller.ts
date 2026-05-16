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
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryFiltersSchema,
  type CreateCategoryDto,
  type UpdateCategoryDto,
  type CategoryFiltersDto,
} from '@grow-logs/schemas';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { ZodValidationPipe } from '../../common/pipes/index.js';
import {
  CategoriesService,
  type CategoryItem,
} from './categories.service.js';

/**
 * Category CRUD endpoints under /api/v1/categories.
 * All routes require a valid JWT — JwtAuthGuard is applied at the class level.
 */
@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all categories with nested subcategories' })
  @ApiOkResponse({ description: 'Categories returned' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(categoryFiltersSchema))
    filters: CategoryFiltersDto,
  ): Promise<{ data: CategoryItem[]; meta: object }> {
    const categories = await this.categoriesService.findAll(
      user.userId,
      filters,
    );
    return { data: categories, meta: {} };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100, example: 'Backend' },
        color: {
          type: 'string',
          enum: [
            '#69B598', '#8285BA', '#B87DA2', '#C4A05E',
            '#62AEBF', '#B87060', '#7DB8B0', '#A87DB8',
          ],
          example: '#69B598',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Category created' })
  @ApiConflictResponse({ description: 'Category name already exists' })
  @ApiUnprocessableEntityResponse({
    description: 'Active category limit reached (3 for free plan)',
  })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createCategorySchema)) dto: CreateCategoryDto,
  ): Promise<{ data: CategoryItem; meta: object }> {
    const category = await this.categoriesService.create(user.userId, dto);
    return { data: category, meta: {} };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a category — rename, recolor, complete, or reactivate',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100, example: 'Backend' },
        color: {
          type: 'string',
          enum: [
            '#69B598', '#8285BA', '#B87DA2', '#C4A05E',
            '#62AEBF', '#B87060', '#7DB8B0', '#A87DB8',
          ],
        },
        isCompleted: { type: 'boolean', example: true },
      },
    },
  })
  @ApiOkResponse({ description: 'Category updated' })
  @ApiConflictResponse({ description: 'Category name already taken' })
  @ApiUnprocessableEntityResponse({
    description:
      'Category not found, rename blocked on completed category, or active limit exceeded on reactivation',
  })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') categoryId: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) dto: UpdateCategoryDto,
  ): Promise<{ data: CategoryItem; meta: object }> {
    const category = await this.categoriesService.update(
      user.userId,
      categoryId,
      dto,
    );
    return { data: category, meta: {} };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an empty category (no entries)' })
  @ApiNoContentResponse({ description: 'Category deleted' })
  @ApiUnprocessableEntityResponse({
    description: 'Category not found or has entries (mark complete instead)',
  })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') categoryId: string,
  ): Promise<void> {
    await this.categoriesService.delete(user.userId, categoryId);
  }
}
