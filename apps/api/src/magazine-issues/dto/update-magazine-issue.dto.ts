import { PartialType } from '@nestjs/swagger';
import { CreateMagazineIssueDto } from './create-magazine-issue.dto';

export class UpdateMagazineIssueDto extends PartialType(CreateMagazineIssueDto) {}
