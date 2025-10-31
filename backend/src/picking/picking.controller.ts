import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PickingService } from './picking.service';
import { PickingRouteOptimizationService } from './services/picking-route-optimization.service';
import { CreateOrderQueueDto } from './dto/create-order-queue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('picking')
@Controller('picking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PickingController {
  constructor(
    private readonly pickingService: PickingService,
    private readonly routeOptimizationService: PickingRouteOptimizationService,
  ) {}

  @Post('queues')
  @Roles(Role.PICKING, Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create order queue from shipment' })
  createFromShipment(@Body('shipmentId') shipmentId: string) {
    return this.pickingService.createFromShipment(shipmentId);
  }

  @Get('queues')
  @Roles(Role.PICKING, Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all order queues' })
  findAll() {
    return this.pickingService.findAll();
  }

  @Get('queues/:id')
  @Roles(Role.PICKING, Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get order queue by ID' })
  findOne(@Param('id') id: string) {
    return this.pickingService.findOne(id);
  }

  @Patch('queues/:id/assign')
  @Roles(Role.PICKING, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Assign order queue to picker' })
  assignQueue(@Param('id') id: string, @Request() req) {
    return this.pickingService.assignQueue(id, req.user.id);
  }

  @Patch('queues/:id/complete')
  @Roles(Role.PICKING)
  @ApiOperation({ summary: 'Complete picking for order queue' })
  completePicking(@Param('id') id: string, @Request() req) {
    return this.pickingService.completePicking(id, req.user.id);
  }

  @Patch('queues/:id/verify')
  @Roles(Role.PICKING)
  @ApiOperation({ summary: 'Verify picked item barcode' })
  verifyPick(
    @Param('id') queueId: string,
    @Body('itemId') itemId: string,
    @Body('barcode') barcode: string,
  ) {
    return this.pickingService.verifyPick(queueId, itemId, barcode);
  }

  @Get('queues/:id/route')
  @Roles(Role.PICKING, Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get optimized picking route for order queue' })
  getOptimizedRoute(@Param('id') id: string) {
    return this.routeOptimizationService.getRouteVisualization(id);
  }

  @Post('queues/batch-route')
  @Roles(Role.PICKING, Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get optimized route for multiple order queues' })
  getBatchRoute(@Body('orderQueueIds') orderQueueIds: string[]) {
    return this.routeOptimizationService.getBatchRouteVisualization(orderQueueIds);
  }

  @Get('queues/:id/optimize')
  @Roles(Role.PICKING, Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Optimize picking route for order queue' })
  optimizeRoute(@Param('id') id: string) {
    return this.routeOptimizationService.optimizeRouteForOrderQueue(id);
  }
}
