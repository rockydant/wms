import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreightBooking, FreightStatus, CarrierType } from '../entities/freight-booking.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { ShipmentStatus } from '../../shipments/entities/shipment.entity';

/**
 * Weekend Freight Scheduling Service
 * Manages freight scheduling for weekends and special dates
 */
@Injectable()
export class WeekendSchedulingService {
  constructor(
    @InjectRepository(FreightBooking)
    private freightBookingRepository: Repository<FreightBooking>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
  ) {}

  /**
   * Schedule freight for weekend delivery
   */
  async scheduleWeekendFreight(
    shipmentId: string,
    carrier: string,
    preferredDate?: Date,
  ): Promise<FreightBooking> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    if (shipment.status !== ShipmentStatus.READY) {
      throw new Error('Shipment must be in READY status for weekend scheduling');
    }

    // Calculate next weekend date
    const weekendDate = preferredDate || this.getNextWeekendDate();
    const cutoffDate = this.getWeekendCutoffDate(weekendDate);

    // Check if shipment is ready before cutoff
    if (new Date() > cutoffDate) {
      throw new Error(
        `Shipment must be ready before cutoff date: ${cutoffDate.toISOString()}`,
      );
    }

    // Create freight booking with weekend flag
    const booking = this.freightBookingRepository.create({
      shipmentId: shipmentId,
      carrierType: carrier as CarrierType,
      status: FreightStatus.PENDING,
      estimatedDeliveryDate: weekendDate,
      carrierName: 'Weekend Delivery',
    } as FreightBooking);

    return this.freightBookingRepository.save(booking);
  }

  /**
   * Get next weekend date (Saturday or Sunday)
   */
  private getNextWeekendDate(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek + 7) % 7 || 7;

    const nextWeekend = new Date(today);
    nextWeekend.setDate(today.getDate() + daysUntilSaturday);
    nextWeekend.setHours(10, 0, 0, 0); // 10 AM on weekend

    return nextWeekend;
  }

  /**
   * Get cutoff date for weekend delivery (typically Thursday 5 PM)
   */
  private getWeekendCutoffDate(weekendDate: Date): Date {
    const cutoff = new Date(weekendDate);
    cutoff.setDate(weekendDate.getDate() - 2); // Thursday
    cutoff.setHours(17, 0, 0, 0); // 5 PM

    return cutoff;
  }

  /**
   * Get all weekend scheduled freight
   */
  async getWeekendSchedules(startDate?: Date, endDate?: Date): Promise<FreightBooking[]> {
    const query = this.freightBookingRepository
      .createQueryBuilder('booking')
      .where('booking.carrierName = :service', { service: 'Weekend Delivery' });

    if (startDate) {
      query.andWhere('booking.estimatedDeliveryDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('booking.estimatedDeliveryDate <= :endDate', { endDate });
    }

    return query.getMany();
  }

  /**
   * Cancel weekend scheduling
   */
  async cancelWeekendSchedule(bookingId: string): Promise<void> {
    await this.freightBookingRepository.update(bookingId, {
      status: 'Cancelled' as any,
    });
  }
}
