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
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new webhook' })
  create(@Body() createDto: CreateWebhookDto) {
    return this.webhooksService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks' })
  findAll(@Query('customerId') customerId?: string) {
    return this.webhooksService.findAll(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  findOne(@Param('id') id: string) {
    return this.webhooksService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update webhook' })
  update(@Param('id') id: string, @Body() updateDto: UpdateWebhookDto) {
    return this.webhooksService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete webhook' })
  remove(@Param('id') id: string) {
    return this.webhooksService.remove(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get webhook logs' })
  getLogs(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.webhooksService.getLogs(id, limit ? parseInt(limit) : 50);
  }

  @Post(':id/logs/:logId/retry')
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Retry failed webhook' })
  retryWebhook(@Param('logId') logId: string) {
    return this.webhooksService.retryWebhook(logId);
  }
}
