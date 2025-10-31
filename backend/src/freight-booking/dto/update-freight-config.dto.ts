import { PartialType } from '@nestjs/swagger';
import { CreateFreightConfigDto } from './create-freight-config.dto';

export class UpdateFreightConfigDto extends PartialType(CreateFreightConfigDto) {}
