import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { InsightReportsService } from './services/insight-reports.service';
import { DailyConfirmationService } from './services/daily-confirmation.service';
import { DepartmentPerformanceService } from './services/department-performance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly insightReportsService: InsightReportsService,
    private readonly dailyConfirmationService: DailyConfirmationService,
    private readonly departmentPerformanceService: DepartmentPerformanceService,
  ) {}

  @Get('receiving/daily')
  @Roles(Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get daily receiving report' })
  getDailyReceiving(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    return this.reportsService.getDailyReceivingReport(targetDate);
  }

  @Get('picking/daily')
  @Roles(Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get daily picking report' })
  getDailyPicking(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    return this.reportsService.getDailyPickingReport(targetDate);
  }

  @Get('shipments/daily')
  @Roles(Role.DELIVERY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get daily shipment report' })
  getDailyShipment(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    return this.reportsService.getDailyShipmentReport(targetDate);
  }

  // Insight Reports for High-Level Management
  @Get('insights/executive')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER, Role.DELIVERY_LEADER)
  @ApiOperation({ summary: 'Get executive insight report with KPIs and trends' })
  getExecutiveInsight(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('customerId') customerId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.insightReportsService.getExecutiveInsightReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      customerId,
      warehouseId,
    );
  }

  @Get('insights/financial')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get financial summary report' })
  getFinancialSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.insightReportsService.getFinancialSummaryReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      customerId,
    );
  }

  // Daily Confirmation Reports for Customers
  @Get('daily-confirmation/:customerId')
  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get daily confirmation report for customer' })
  getDailyConfirmation(@Param('customerId') customerId: string, @Query('date') date?: string) {
    return this.dailyConfirmationService.generateDailyConfirmationReport(
      customerId,
      date ? new Date(date) : undefined,
    );
  }

  @Get('daily-confirmation')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get daily confirmation reports for all customers' })
  getAllDailyConfirmationReports(@Query('date') date?: string) {
    return this.dailyConfirmationService.generateAllDailyConfirmationReports(
      date ? new Date(date) : undefined,
    );
  }

  @Post('daily-confirmation/:customerId/send')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send daily confirmation report to customer' })
  sendDailyConfirmation(@Param('customerId') customerId: string, @Query('date') date?: string) {
    return this.dailyConfirmationService.sendDailyConfirmationReport(
      customerId,
      date ? new Date(date) : undefined,
    );
  }

  @Post('daily-confirmation/send-all')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send daily confirmation reports to all active customers' })
  sendAllDailyConfirmationReports(@Query('date') date?: string) {
    return this.dailyConfirmationService.sendAllDailyConfirmationReports(
      date ? new Date(date) : undefined,
    );
  }

  // Department Performance Reports
  @Get('performance/departments')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER, Role.DELIVERY_LEADER)
  @ApiOperation({ summary: 'Get performance report for all departments' })
  getDepartmentPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('customerId') customerId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.departmentPerformanceService.getDepartmentPerformanceReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      customerId,
      warehouseId,
    );
  }
}
