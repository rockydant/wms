import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreightBooking, FreightStatus, CarrierType } from './entities/freight-booking.entity';
import { CreateFreightBookingDto } from './dto/create-freight-booking.dto';
import { UpdateFreightBookingDto } from './dto/update-freight-booking.dto';
import { ShipmentsService } from '../shipments/shipments.service';

@Injectable()
export class FreightBookingService {
  constructor(
    @InjectRepository(FreightBooking)
    private freightBookingRepository: Repository<FreightBooking>,
    private shipmentsService: ShipmentsService,
  ) {}

  async create(createDto: CreateFreightBookingDto): Promise<FreightBooking> {
    // Verify shipment exists
    const shipment = await this.shipmentsService.findOne(createDto.shipmentId);

    const booking = this.freightBookingRepository.create({
      ...createDto,
      status: FreightStatus.PENDING,
    });

    return this.freightBookingRepository.save(booking);
  }

  async findAll(): Promise<FreightBooking[]> {
    return this.freightBookingRepository.find({
      relations: ['shipment', 'warehouse'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByShipment(shipmentId: string): Promise<FreightBooking[]> {
    return this.freightBookingRepository.find({
      where: { shipmentId },
      relations: ['shipment', 'warehouse'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FreightBooking> {
    const booking = await this.freightBookingRepository.findOne({
      where: { id },
      relations: ['shipment', 'warehouse'],
    });
    if (!booking) {
      throw new NotFoundException(`Freight booking with ID ${id} not found`);
    }
    return booking;
  }

  async update(id: string, updateDto: UpdateFreightBookingDto): Promise<FreightBooking> {
    await this.freightBookingRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.freightBookingRepository.softDelete(id);
  }

  /**
   * Automatically book freight for a shipment
   */
  async autoBookFreight(shipmentId: string, carrierType: CarrierType): Promise<FreightBooking> {
    const shipment = await this.shipmentsService.findOne(shipmentId);

    if (shipment.status !== 'Ready' && shipment.status !== 'Shipped') {
      throw new Error('Shipment must be Ready or Shipped to book freight');
    }

    // Calculate estimated cost based on carrier and shipment details
    const estimatedCost = this.calculateEstimatedCost(shipment, carrierType);

    // Generate tracking number (placeholder - would integrate with carrier API)
    const trackingNumber = this.generateTrackingNumber(carrierType);

    // Estimate delivery date (placeholder - would calculate based on carrier)
    const estimatedDeliveryDate = this.estimateDeliveryDate(carrierType);

    const booking = this.freightBookingRepository.create({
      shipmentId,
      warehouseId: shipment.warehouseId,
      carrierType,
      trackingNumber,
      cost: estimatedCost,
      estimatedDeliveryDate,
      status: FreightStatus.BOOKED,
      bookedAt: new Date(),
    });

    const savedBooking = await this.freightBookingRepository.save(booking);

    // Update shipment with tracking number if not already set
    if (!shipment.trackingNumber && trackingNumber) {
      await this.shipmentsService.update(shipmentId, {
        trackingNumber,
      });
    }

    return savedBooking;
  }

  /**
   * Calculate estimated freight cost (placeholder logic)
   */
  private calculateEstimatedCost(shipment: any, carrierType: CarrierType): number {
    // Placeholder calculation based on shipment quantity and carrier
    const baseRates: Record<CarrierType, number> = {
      [CarrierType.UPS]: 15.0,
      [CarrierType.FEDEX]: 18.0,
      [CarrierType.USPS]: 12.0,
      [CarrierType.DHL]: 20.0,
      [CarrierType.CUSTOM]: 25.0,
    };

    const baseRate = baseRates[carrierType] || 15.0;
    const itemCount = shipment.totalQuantity || 1;
    const costPerItem = 2.0;

    return baseRate + itemCount * costPerItem;
  }

  /**
   * Generate tracking number (placeholder - would integrate with carrier API)
   */
  private generateTrackingNumber(carrierType: CarrierType): string {
    const prefix: Record<CarrierType, string> = {
      [CarrierType.UPS]: '1Z',
      [CarrierType.FEDEX]: '7',
      [CarrierType.USPS]: '9405',
      [CarrierType.DHL]: '7',
      [CarrierType.CUSTOM]: 'CUS',
    };

    const prefixStr = prefix[carrierType] || 'TRK';
    const randomStr = Math.random().toString(36).substring(2, 15).toUpperCase();
    return `${prefixStr}${randomStr}`;
  }

  /**
   * Estimate delivery date (placeholder - would calculate based on carrier)
   */
  private estimateDeliveryDate(carrierType: CarrierType): Date {
    const deliveryDays: Record<CarrierType, number> = {
      [CarrierType.UPS]: 3,
      [CarrierType.FEDEX]: 2,
      [CarrierType.USPS]: 5,
      [CarrierType.DHL]: 4,
      [CarrierType.CUSTOM]: 7,
    };

    const days = deliveryDays[carrierType] || 3;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  async updateStatus(id: string, status: FreightStatus): Promise<FreightBooking> {
    const booking = await this.findOne(id);
    booking.status = status;

    if (status === FreightStatus.DELIVERED) {
      booking.deliveredAt = new Date();
    }

    return this.freightBookingRepository.save(booking);
  }
}
