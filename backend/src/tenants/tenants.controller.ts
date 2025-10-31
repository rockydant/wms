import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new tenant' })
  create(@Body() createDto: CreateTenantDto) {
    return this.tenantsService.create(createDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get('subdomain/:subdomain')
  @ApiOperation({ summary: 'Get tenant by subdomain' })
  findBySubdomain(@Param('subdomain') subdomain: string) {
    return this.tenantsService.findBySubdomain(subdomain);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update tenant' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateDto);
  }

  @Patch(':id/subscription')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update tenant subscription' })
  updateSubscription(@Param('id') id: string, @Body() updateDto: UpdateSubscriptionDto) {
    return this.tenantsService.updateSubscription(
      id,
      updateDto.plan,
      updateDto.status,
    );
  }

  @Get(':id/usage')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get tenant usage statistics' })
  getUsageStats(@Param('id') id: string) {
    return this.tenantsService.getUsageStats(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete tenant' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
