import { Injectable, BadRequestException } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { ShipmentsService } from '../shipments/shipments.service';
import { InventoryService } from '../inventory/inventory.service';
import csv from 'csv-parser';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

@Injectable()
export class FileImportExportService {
  constructor(
    private customersService: CustomersService,
    private shipmentsService: ShipmentsService,
    private inventoryService: InventoryService,
  ) {}

  /**
   * Import shipments from CSV
   */
  async importShipmentsFromCSV(customerId: string, fileBuffer: Buffer): Promise<any> {
    const results: any[] = [];
    const errors: string[] = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(fileBuffer);
      const rows: any[] = [];

      stream
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', async () => {
          (async () => {
            try {
              let rowIndex = 0;
              for (const row of rows) {
                rowIndex++;
                try {
                  const items = this.parseItemsFromRow(row);
                  if (items.length > 0) {
                    const shipment = await this.shipmentsService.create({
                      customerId,
                      warehouseId: row.warehouseId,
                      items,
                    });
                    results.push({ row: rowIndex, shipment: shipment.id });
                  }
                } catch (error: any) {
                  errors.push(`Row ${rowIndex}: ${error.message}`);
                }
              }
              resolve({ success: results.length, errors, results });
            } catch (error: any) {
              reject(error);
            }
          })();
        })
        .on('error', reject);
    });
  }

  /**
   * Import shipments from XLSX
   */
  async importShipmentsFromXLSX(customerId: string, fileBuffer: Buffer): Promise<any> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.getWorksheet(1); // Get first sheet
    if (!worksheet) {
      throw new BadRequestException('Excel file must have at least one sheet');
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row.hasValues) continue;

      try {
        const rowData: any = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = worksheet.getRow(1).getCell(colNumber).value?.toString() || '';
          rowData[header.toLowerCase().replace(/\s+/g, '')] = cell.value?.toString() || '';
        });

        const items = this.parseItemsFromRow(rowData);
        if (items.length > 0) {
          const shipment = await this.shipmentsService.create({
            customerId,
            warehouseId: rowData.warehouseid,
            items,
          });
          results.push({ row: rowNumber, shipment: shipment.id });
        }
      } catch (error: any) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    return { success: results.length, errors, results };
  }

  /**
   * Export shipments to CSV
   */
  async exportShipmentsToCSV(customerId?: string, warehouseId?: string): Promise<string> {
    const shipments = customerId
      ? await this.shipmentsService.findByCustomer(customerId, warehouseId)
      : await this.shipmentsService.findAll(warehouseId);

    const headers = [
      'Shipment ID',
      'Customer ID',
      'Warehouse ID',
      'Status',
      'Total Quantity',
      'Fulfilled Quantity',
      'Fulfillment %',
      'Created At',
      'Shipped At',
    ];

    const rows = shipments.map((shipment) => [
      shipment.id,
      shipment.customerId,
      shipment.warehouseId || '',
      shipment.status,
      shipment.totalQuantity,
      shipment.fulfilledQuantity,
      shipment.fulfillmentPercentage.toFixed(2),
      shipment.createdAt.toISOString(),
      shipment.shippedAt?.toISOString() || '',
    ]);

    return this.generateCSV([headers, ...rows]);
  }

  /**
   * Export shipments to XLSX
   */
  async exportShipmentsToXLSX(customerId?: string, warehouseId?: string): Promise<Buffer> {
    const shipments = customerId
      ? await this.shipmentsService.findByCustomer(customerId, warehouseId)
      : await this.shipmentsService.findAll(warehouseId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Shipments');

    // Add headers
    worksheet.addRow([
      'Shipment ID',
      'Customer ID',
      'Warehouse ID',
      'Status',
      'Total Quantity',
      'Fulfilled Quantity',
      'Fulfillment %',
      'Created At',
      'Shipped At',
    ]);

    // Add data rows
    shipments.forEach((shipment) => {
      worksheet.addRow([
        shipment.id,
        shipment.customerId,
        shipment.warehouseId || '',
        shipment.status,
        shipment.totalQuantity,
        shipment.fulfilledQuantity,
        shipment.fulfillmentPercentage.toFixed(2),
        shipment.createdAt,
        shipment.shippedAt || '',
      ]);
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export inventory to CSV
   */
  async exportInventoryToCSV(customerId?: string): Promise<string> {
    const items = customerId
      ? await this.inventoryService.findByCustomer(customerId)
      : await this.inventoryService.findAll();

    const headers = [
      'ID',
      'Customer ID',
      'SKU',
      'Size',
      'Color',
      'Status',
      'Inventory Barcode',
      'Picking Barcode',
      'Location Code',
      'Created At',
    ];

    const rows = items.map((item) => [
      item.id,
      item.customerId,
      item.sku,
      item.size,
      item.color,
      item.status,
      item.inventoryBarcode,
      item.pickingBarcode || '',
      item.location?.locationCode || '',
      item.createdAt.toISOString(),
    ]);

    return this.generateCSV([headers, ...rows]);
  }

  /**
   * Export inventory to XLSX
   */
  async exportInventoryToXLSX(customerId?: string): Promise<Buffer> {
    const items = customerId
      ? await this.inventoryService.findByCustomer(customerId)
      : await this.inventoryService.findAll();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    worksheet.addRow([
      'ID',
      'Customer ID',
      'SKU',
      'Size',
      'Color',
      'Status',
      'Inventory Barcode',
      'Picking Barcode',
      'Location Code',
      'Created At',
    ]);

    items.forEach((item) => {
      worksheet.addRow([
        item.id,
        item.customerId,
        item.sku,
        item.size,
        item.color,
        item.status,
        item.inventoryBarcode,
        item.pickingBarcode || '',
        item.location?.locationCode || '',
        item.createdAt,
      ]);
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Helper: Parse items from row data
   */
  private parseItemsFromRow(row: any): any[] {
    const items: any[] = [];

    // Support multiple formats: items as JSON string or individual columns
    if (row.items) {
      try {
        return JSON.parse(row.items);
      } catch {
        // If not JSON, parse from columns
      }
    }

    // Parse from columns (sku, size, color, quantity)
    const sku = row.sku;
    const size = row.size;
    const color = row.color;
    const quantity = parseInt(row.quantity || row.qty || '1', 10);

    if (sku && size && color) {
      items.push({ sku, size, color, quantity });
    }

    return items;
  }

  /**
   * Helper: Generate CSV string
   */
  private generateCSV(rows: any[][]): string {
    return rows
      .map((row) =>
        row
          .map((cell) => {
            const cellString = String(cell || '');
            // Escape quotes and wrap in quotes if contains comma or quote
            if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
              return `"${cellString.replace(/"/g, '""')}"`;
            }
            return cellString;
          })
          .join(','),
      )
      .join('\n');
  }
}
