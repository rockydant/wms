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
import { BillingService } from './billing.service';
import { EnhancedBillingService } from './services/enhanced-billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly enhancedBillingService: EnhancedBillingService,
  ) {}

  @Post('invoices')
  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a new invoice' })
  create(@Body() createDto: CreateInvoiceDto) {
    return this.billingService.create(createDto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  findAll(@Query('customerId') customerId?: string) {
    return this.billingService.findAll(customerId);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Patch('invoices/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update invoice' })
  update(@Param('id') id: string, @Body() updateDto: UpdateInvoiceDto) {
    return this.billingService.update(id, updateDto);
  }

  @Delete('invoices/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete invoice' })
  remove(@Param('id') id: string) {
    return this.billingService.remove(id);
  }

  @Post('invoices/generate')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate invoice for a billing period' })
  generateInvoice(@Body() generateDto: GenerateInvoiceDto) {
    return this.billingService.generateInvoiceForPeriod(
      generateDto.customerId,
      new Date(generateDto.startDate),
      new Date(generateDto.endDate),
      generateDto.billingTypes,
    );
  }

  @Patch('invoices/:id/paid')
  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Mark invoice as paid' })
  markAsPaid(@Param('id') id: string) {
    return this.billingService.markAsPaid(id);
  }

  @Post('enhanced/generate')
  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Generate enhanced invoice with cubic feet and order count billing' })
  generateEnhancedInvoice(
    @Body('customerId') customerId: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('storageRate') storageRate?: number,
    @Body('orderRate') orderRate?: number,
  ) {
    return this.enhancedBillingService.generateEnhancedInvoice(
      customerId,
      new Date(startDate),
      new Date(endDate),
      storageRate,
      orderRate,
    );
  }

  @Get('enhanced/report')
  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get detailed billing report with item-level details' })
  getDetailedBillingReport(
    @Query('customerId') customerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.enhancedBillingService.getDetailedBillingReport(
      customerId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('enhanced/storage-cost')
  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Calculate storage cost per cubic feet' })
  calculateStorageCostByVolume(
    @Query('customerId') customerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('ratePerCubicFoot') ratePerCubicFoot?: string,
  ) {
    return this.enhancedBillingService.calculateStorageCostByVolume(
      customerId,
      new Date(startDate),
      new Date(endDate),
      ratePerCubicFoot ? parseFloat(ratePerCubicFoot) : 0.50,
    );
  }

  @Get('enhanced/order-cost')
  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Calculate billing per order count' })
  calculateBillingPerOrder(
    @Query('customerId') customerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('ratePerOrder') ratePerOrder?: string,
  ) {
    return this.enhancedBillingService.calculateBillingPerOrder(
      customerId,
      new Date(startDate),
      new Date(endDate),
      ratePerOrder ? parseFloat(ratePerOrder) : 2.00,
    );
  }
}
