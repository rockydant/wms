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
import { ReceivingService } from './receiving.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('receiving')
@Controller('receiving')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Post('purchase-orders')
  @Roles(Role.RECEIVING, Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new purchase order' })
  create(@Body() createPoDto: CreatePurchaseOrderDto) {
    return this.receivingService.create(createPoDto);
  }

  @Get('purchase-orders')
  @Roles(Role.RECEIVING, Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all purchase orders' })
  findAll() {
    return this.receivingService.findAll();
  }

  @Get('purchase-orders/:id')
  @Roles(Role.RECEIVING, Role.INVENTORY_LEADER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get purchase order by ID' })
  findOne(@Param('id') id: string) {
    return this.receivingService.findOne(id);
  }

  @Patch('purchase-orders/:id/receive-item')
  @Roles(Role.RECEIVING)
  @ApiOperation({ summary: 'Receive an item from purchase order' })
  receiveItem(
    @Param('id') poId: string,
    @Body('itemId') itemId: string,
    @Body('locationId') locationId?: string,
  ) {
    return this.receivingService.receiveItem(poId, itemId, locationId);
  }

  @Patch('purchase-orders/:id/complete')
  @Roles(Role.RECEIVING, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Complete a purchase order' })
  complete(@Param('id') id: string, @Request() req) {
    return this.receivingService.completePO(id, req.user.id);
  }
}
