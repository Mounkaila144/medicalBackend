import { Controller, Get, Post, Body, Param, Req, Res, UseGuards, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { GenerateReportDto } from '../dto/generate-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity';
import * as fs from 'fs';
import * as path from 'path';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async generateReport(@Body() generateReportDto: GenerateReportDto, @Req() req) {
    return this.analyticsService.generate(req.user.tenantId, generateReportDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DOCTOR)
  async getAllReports(@Req() req) {
    return this.reportRepository.find({
      where: { tenantId: req.user.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DOCTOR)
  async getReportById(@Param('id') id: string, @Req() req) {
    const report = await this.reportRepository.findOne({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DOCTOR)
  async downloadReport(@Param('id') id: string, @Req() req, @Res() res: Response) {
    const report = await this.reportRepository.findOne({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    const filePath = path.resolve(report.generatedPath);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Report file not found`);
    }

    const contentType = report.format === 'PDF' ? 'application/pdf' : 'text/csv';
    const fileName = path.basename(filePath);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Post('refresh-views')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async refreshMaterializedViews() {
    await this.analyticsService.refreshMaterializedViews();
    return { message: 'Materialized views refreshed successfully' };
  }
} 