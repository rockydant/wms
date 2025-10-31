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
import { FreightBookingService } from './freight-booking.service';
import { WeekendSchedulingService } from './services/weekend-scheduling.service';
import { FreightManagementService } from './services/freight-management.service';
import { CreateFreightConfigDto } from './dto/create-freight-config.dto';
import { UpdateFreightConfigDto } from './dto/update-freight-config.dto';
import { CreateFreightBookingDto } from './dto/create-freight-booking.dto';
import { UpdateFreightBookingDto } from './dto/update-freight-booking.dto';
import { AutoBookFreightDto } from './dto/auto-book-freight.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { FreightStatus } from './entities/freight-booking.entity';

@ApiTags('freight-booking')
@Controller('freight-booking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FreightBookingController {
  constructor(
    private readonly freightBookingService: FreightBookingService,
    private readonly weekendSchedulingService: WeekendSchedulingService,
    private readonly freightManagementService: FreightManagementService,
  ) {}

  @Post()
  @Roles(Role.PACKAGING, Role.DELIVERY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new freight booking' })
  create(@Body() createDto: CreateFreightBookingDto) {
    return this.freightBookingService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all freight bookings' })
  findAll(@Query('shipmentId') shipmentId?: string) {
    if (shipmentId) {
      return this.freightBookingService.findByShipment(shipmentId);
    }
    return this.freightBookingService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get freight booking by ID' })
  findOne(@Param('id') id: string) {
    return this.freightBookingService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.PACKAGING, Role.DELIVERY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update freight booking' })
  update(@Param('id') id: string, @Body() updateDto: UpdateFreightBookingDto) {
    return this.freightBookingService.update(id, updateDto);
  }

  @Patch(':id/status')
  @Roles(Role.PACKAGING, Role.DELIVERY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update freight booking status' })
  updateStatus(@Param('id') id: string, @Body('status') status: FreightStatus) {
    return this.freightBookingService.updateStatus(id, status);
  }

  @Post('auto-book')
  @Roles(Role.PACKAGING, Role.DELIVERY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Automatically book freight for a shipment' })
  autoBookFreight(@Body() autoBookDto: AutoBookFreightDto) {
    return this.freightBookingService.autoBookFreight(
      autoBookDto.shipmentId,
      autoBookDto.carrierType,
    );
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete freight booking' })
  remove(@Param('id') id: string) {
    return this.freightBookingService.remove(id);
  }

  @Post('weekend/schedule')
  @Roles(Role.PACKAGING, Role.DELIVERY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Schedule freight for weekend delivery' })
  scheduleWeekendFreight(
    @Body('shipmentId') shipmentId: string,
    @Body('carrier') carrier: string,
    @Body('preferredDate') preferredDate?: string,
  ) {
    return this.weekendSchedulingService.scheduleWeekendFreight(
      shipmentId,
      carrier,
      preferredDate ? new Date(preferredDate) : undefined,
    );
  }

  @Get('weekend/schedules')
  @Roles(Role.PACKAGING, Role.DELIVERY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all weekend scheduled freight' })
  getWeekendSchedules(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.weekendSchedulingService.getWeekendSchedules(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Patch('weekend/:id/cancel')
  @Roles(Role.PACKAGING, Role.DELIVERY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel weekend scheduling' })
  cancelWeekendSchedule(@Param('id') id: string) {
    return this.weekendSchedulingService.cancelWeekendSchedule(id);
  }

  // Freight Management & Configuration
  @Get('configs')
  @Roles(Role.SUPER_ADMIN, Role.DELIVERY_LEADER, Role.PACKAGING)
  @ApiOperation({ summary: 'Get all freight configurations' })
  getAllConfigs(@Query('active') activeOnly?: boolean) {
    return activeOnly
      ? this.freightManagementService.getActiveConfigs()
      : this.freightManagementService.getAllConfigs();
  }

  @Get('configs/:id')
  @Roles(Role.SUPER_ADMIN, Role.DELIVERY_LEADER)
  @ApiOperation({ summary: 'Get freight configuration by ID' })
  getConfigById(@Param('id') id: string) {
    return this.freightManagementService.getConfigById(id);
  }

  @Get('configs/carrier/:carrierType')
  @Roles(Role.SUPER_ADMIN, Role.DELIVERY_LEADER, Role.PACKAGING)
  @ApiOperation({ summary: 'Get freight configurations by carrier type' })
  getConfigsByCarrier(@Param('carrierType') carrierType: string) {
    return this.freightManagementService.getConfigsByCarrier(carrierType);
  }

  @Post('configs')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new freight configuration' })
  createConfig(@Body() createDto: CreateFreightConfigDto) {
    return this.freightManagementService.createConfig(createDto);
  }

  @Patch('configs/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update freight configuration' })
  updateConfig(@Param('id') id: string, @Body() updateDto: UpdateFreightConfigDto) {
    return this.freightManagementService.updateConfig(id, updateDto);
  }

  @Delete('configs/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete freight configuration' })
  deleteConfig(@Param('id') id: string) {
    return this.freightManagementService.deleteConfig(id);
  }

  @Post('configs/:id/toggle')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enable/disable freight configuration' })
  toggleConfigStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.freightManagementService.toggleConfigStatus(id, isActive);
  }

  @Post('configs/calculate')
  @Roles(Role.SUPER_ADMIN, Role.DELIVERY_LEADER, Role.PACKAGING)
  @ApiOperation({ summary: 'Calculate shipping cost' })
  calculateShippingCost(
    @Body('configId') configId: string,
    @Body('weight') weight: number,
    @Body('volume') volume: number,
    @Body('isWeekend') isWeekend?: boolean,
  ) {
    return this.freightManagementService.calculateShippingCost(
      configId,
      weight,
      volume,
      isWeekend || false,
    );
  }

  @Post('configs/best-option')
  @Roles(Role.SUPER_ADMIN, Role.DELIVERY_LEADER, Role.PACKAGING)
  @ApiOperation({ summary: 'Get best shipping option for given criteria' })
  getBestShippingOption(
    @Body('weight') weight: number,
    @Body('volume') volume: number,
    @Body('maxTransitDays') maxTransitDays?: number,
    @Body('requireWeekendDelivery') requireWeekendDelivery?: boolean,
  ) {
    return this.freightManagementService.getBestShippingOption(
      weight,
      volume,
      maxTransitDays,
      requireWeekendDelivery || false,
    );
  }

  @Get('statistics')
  @Roles(Role.SUPER_ADMIN, Role.DELIVERY_LEADER)
  @ApiOperation({ summary: 'Get freight statistics' })
  getFreightStatistics() {
    return this.freightManagementService.getFreightStatistics();
  }
}
