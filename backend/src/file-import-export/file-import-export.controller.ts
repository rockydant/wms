import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { FileImportExportService } from './file-import-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('file-import-export')
@Controller('file-import-export')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FileImportExportController {
  constructor(private readonly fileImportExportService: FileImportExportService) {}

  @Post('shipments/import/csv')
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Import shipments from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importShipmentsFromCSV(
    @Body('customerId') customerId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.fileImportExportService.importShipmentsFromCSV(
      customerId,
      file.buffer,
    );
  }

  @Post('shipments/import/xlsx')
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Import shipments from XLSX file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importShipmentsFromXLSX(
    @Body('customerId') customerId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.fileImportExportService.importShipmentsFromXLSX(
      customerId,
      file.buffer,
    );
  }

  @Get('shipments/export/csv')
  @ApiOperation({ summary: 'Export shipments to CSV' })
  async exportShipmentsToCSV(
    @Res() res: Response,
    @Query('customerId') customerId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    const csv = await this.fileImportExportService.exportShipmentsToCSV(customerId, warehouseId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=shipments-${Date.now()}.csv`);
    res.send(csv);
  }

  @Get('shipments/export/xlsx')
  @ApiOperation({ summary: 'Export shipments to XLSX' })
  async exportShipmentsToXLSX(
    @Res() res: Response,
    @Query('customerId') customerId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    const buffer = await this.fileImportExportService.exportShipmentsToXLSX(customerId, warehouseId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=shipments-${Date.now()}.xlsx`);
    res.send(buffer);
  }

  @Get('inventory/export/csv')
  @ApiOperation({ summary: 'Export inventory to CSV' })
  async exportInventoryToCSV(
    @Res() res: Response,
    @Query('customerId') customerId?: string,
  ) {
    const csv = await this.fileImportExportService.exportInventoryToCSV(customerId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=inventory-${Date.now()}.csv`);
    res.send(csv);
  }

  @Get('inventory/export/xlsx')
  @ApiOperation({ summary: 'Export inventory to XLSX' })
  async exportInventoryToXLSX(
    @Res() res: Response,
    @Query('customerId') customerId?: string,
  ) {
    const buffer = await this.fileImportExportService.exportInventoryToXLSX(customerId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventory-${Date.now()}.xlsx`);
    res.send(buffer);
  }
}
