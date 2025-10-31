import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { RealtimeDashboardService } from './services/realtime-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly realtimeDashboardService: RealtimeDashboardService,
  ) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Get comprehensive dashboard data' })
  getDashboard(
    @Query('customerId') customerId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.dashboardService.getDashboardData(customerId, warehouseId);
  }

  @Get('realtime')
  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Get real-time metrics for WebSocket streaming' })
  getRealtimeMetrics(
    @Query('customerId') customerId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.dashboardService.getRealtimeMetrics(customerId, warehouseId);
  }

  @Get('realtime-operations')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER, Role.DELIVERY_LEADER)
  @ApiOperation({ summary: 'Get real-time dashboard for daily operations' })
  getRealtimeDashboard(
    @Query('warehouseId') warehouseId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.realtimeDashboardService.getRealtimeDashboard(warehouseId, customerId);
  }
}
