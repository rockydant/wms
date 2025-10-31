import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new subscription' })
  create(@Body() createDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all subscriptions' })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.subscriptionsService.findAll(tenantId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get subscription by ID' })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Get('tenant/:tenantId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get active subscription for tenant' })
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.findByTenant(tenantId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update subscription' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, updateDto);
  }

  @Patch(':id/activate')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate subscription' })
  activate(@Param('id') id: string) {
    return this.subscriptionsService.activate(id);
  }

  @Patch(':id/cancel')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.subscriptionsService.cancel(id, reason);
  }

  @Get('tenant/:tenantId/usage-billing')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Calculate usage-based billing for tenant' })
  calculateUsageBilling(
    @Param('tenantId') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.subscriptionsService.calculateUsageBilling(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete subscription' })
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
