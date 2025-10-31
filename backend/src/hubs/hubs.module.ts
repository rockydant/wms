import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubsService } from './hubs.service';
import { HubsController } from './hubs.controller';
import { Hub } from './entities/hub.entity';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hub]),
    WarehouseModule,
    CustomersModule,
  ],
  controllers: [HubsController],
  providers: [HubsService],
  exports: [HubsService],
})
export class HubsModule {}
