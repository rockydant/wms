import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PackagingService } from './packaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('packaging')
@Controller('packaging')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PackagingController {
  constructor(private readonly packagingService: PackagingService) {}

  @Get('ready')
  @Roles(Role.PACKAGING, Role.DELIVERY_LEADER)
  @ApiOperation({ summary: 'Get shipments ready for packaging' })
  getReadyShipments() {
    return this.packagingService.getShipmentsReadyForPackaging();
  }

  @Patch(':id/package')
  @Roles(Role.PACKAGING)
  @ApiOperation({ summary: 'Package and ship a shipment' })
  packageShipment(
    @Param('id') id: string,
    @Body('autoBookFreight') autoBookFreight?: boolean,
    @Body('carrierType') carrierType?: string,
  ) {
    return this.packagingService.packageShipment(
      id,
      autoBookFreight || false,
      carrierType as any,
    );
  }
}
