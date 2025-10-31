import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BarcodesService {
  async generateInventoryBarcode(sku: string): Promise<string> {
    // Format: INV-{SKU}-{UUID}
    const uuid = uuidv4().substring(0, 8).toUpperCase();
    return `INV-${sku}-${uuid}`;
  }

  async generatePickingBarcode(sku: string, orderId: string): Promise<string> {
    // Format: PICK-{ORDER_ID}-{SKU}-{UUID}
    const uuid = uuidv4().substring(0, 8).toUpperCase();
    return `PICK-${orderId.substring(0, 8)}-${sku}-${uuid}`;
  }
}
