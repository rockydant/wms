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
import { QcService } from './qc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('qc')
@Controller('qc')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @Patch('verify')
  @Roles(Role.QC, Role.DELIVERY_LEADER)
  @ApiOperation({ summary: 'Verify item barcodes' })
  verifyItem(
    @Body('queueId') queueId: string,
    @Body('itemId') itemId: string,
    @Body('inventoryBarcode') inventoryBarcode: string,
    @Body('pickingBarcode') pickingBarcode: string,
  ) {
    return this.qcService.verifyItem(queueId, itemId, inventoryBarcode, pickingBarcode);
  }

  @Patch('complete')
  @Roles(Role.QC, Role.DELIVERY_LEADER)
  @ApiOperation({ summary: 'Complete QC for an order queue' })
  completeQC(
    @Body('queueId') queueId: string,
    @Body('shipmentId') shipmentId: string,
  ) {
    return this.qcService.completeQC(queueId, shipmentId);
  }
}
