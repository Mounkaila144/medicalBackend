import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportFormat } from '../entities/report.entity';
import { GenerateReportDto, ReportType } from '../dto/generate-report.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import * as csv from 'fast-csv';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private configService: ConfigService,
  ) {}

  async generate(tenantId: string, generateReportDto: GenerateReportDto): Promise<Report> {
    console.log('Starting report generation with:', { tenantId, generateReportDto });
    
    const { reportType, name, params, format = ReportFormat.PDF } = generateReportDto;
    
    try {
      // Test 1: Récupérer les données selon le type de rapport
      console.log('Step 1: Fetching report data...');
      const data = await this.fetchReportData(tenantId, reportType, params);
      console.log('Data fetched successfully:', data.length, 'records');
      
      // Test 2: Générer le fichier
      console.log('Step 2: Generating file...');
      const filePath = await this.generateFile(tenantId, name, data, format);
      console.log('File generated successfully at:', filePath);
      
      // Test 3: Créer l'entrée de rapport dans la base de données
      console.log('Step 3: Creating report entity...');
      const report = this.reportRepository.create({
        tenantId,
        name,
        params,
        generatedPath: filePath,
        format,
      });
      console.log('Report entity created:', report);
      
      // Test 4: Sauvegarder en base
      console.log('Step 4: Saving to database...');
      const savedReport = await this.reportRepository.save(report);
      console.log('Report saved successfully:', savedReport);
      
      return savedReport;
    } catch (error) {
      console.error('Error in generate method at step:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  private async fetchReportData(
    tenantId: string,
    reportType: ReportType,
    params: Record<string, any>,
  ): Promise<any[]> {
    const { startDate, endDate, practitionerId } = params;
    
    // Pour l'instant, générer des données simulées
    // TODO: Implémenter les vraies requêtes une fois les vues matérialisées créées
    
    switch (reportType) {
      case ReportType.DAILY_REVENUE:
        return this.generateMockDailyRevenue(startDate, endDate);
        
      case ReportType.PRACTITIONER_KPI:
        return this.generateMockPractitionerKPI(practitionerId);
        
      case ReportType.OCCUPANCY_RATE:
        return this.generateMockOccupancyRate(startDate, endDate, practitionerId);
        
      default:
        throw new NotFoundException(`Report type ${reportType} not supported`);
    }
  }

  private generateMockDailyRevenue(startDate: string, endDate: string): any[] {
    const data: any[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      data.push({
        date: d.toISOString().split('T')[0],
        total_revenue: Math.floor(Math.random() * 2000) + 500,
        invoice_count: Math.floor(Math.random() * 20) + 5,
      });
    }
    
    return data;
  }

  private generateMockPractitionerKPI(practitionerId?: string): any[] {
    return [
      {
        practitioner_id: practitionerId || 'b84141c5-8d0e-4b80-9da7-d5f6b2812daa',
        practitioner_name: 'Dr. Sarah Johnson',
        appointment_count: 45,
        avg_appointment_duration_minutes: 30,
        total_revenue: 6750.00,
      },
      {
        practitioner_id: '550e8400-e29b-41d4-a716-446655440000',
        practitioner_name: 'Dr. Michael Brown',
        appointment_count: 38,
        avg_appointment_duration_minutes: 35,
        total_revenue: 5700.00,
      },
    ];
  }

  private generateMockOccupancyRate(startDate: string, endDate: string, practitionerId?: string): any[] {
    const data: any[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      data.push({
        date: d.toISOString().split('T')[0],
        practitioner_id: practitionerId || 'b84141c5-8d0e-4b80-9da7-d5f6b2812daa',
        daily_occupancy_rate: Math.random() * 0.8 + 0.2, // Entre 20% et 100%
      });
    }
    
    return data;
  }

  private async generateFile(
    tenantId: string,
    name: string,
    data: any[],
    format: ReportFormat,
  ): Promise<string> {
    const timestamp = new Date().getTime();
    const fileName = `${name.replace(/\s+/g, '_')}_${timestamp}`;
    const dirPath = path.join('storage', 'reports', tenantId);
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    let filePath: string;
    
    if (format === ReportFormat.PDF) {
      filePath = path.join(dirPath, `${fileName}.pdf`);
      await this.generatePDF(data, filePath);
    } else {
      filePath = path.join(dirPath, `${fileName}.csv`);
      await this.generateCSV(data, filePath);
    }
    
    return filePath;
  }

  private async generatePDF(data: any[], filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Ajouter un titre
      doc.fontSize(16).text('Rapport', { align: 'center' });
      doc.moveDown();
      
      // Ajouter les données
      if (data.length > 0) {
        // Créer l'en-tête
        const headers = Object.keys(data[0]);
        const tableTop = 150;
        const rowHeight = 30;
        const colWidth = 500 / headers.length;
        
        // En-têtes
        doc.fontSize(10);
        headers.forEach((header, i) => {
          doc.text(header, 50 + (i * colWidth), tableTop, { width: colWidth });
        });
        
        // Lignes de données
        data.forEach((row, rowIndex) => {
          const y = tableTop + 20 + (rowIndex * rowHeight);
          
          headers.forEach((header, colIndex) => {
            doc.text(
              String(row[header]),
              50 + (colIndex * colWidth),
              y,
              { width: colWidth }
            );
          });
        });
      } else {
        doc.text('Aucune donnée disponible pour ce rapport.');
      }
      
      doc.end();
      
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });
  }

  private async generateCSV(data: any[], filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      csv.write(data, { headers: true })
        .pipe(stream)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  async refreshMaterializedViews(): Promise<void> {
    // Pour l'instant, ne rien faire car les vues n'existent pas encore
    // TODO: Implémenter une fois les vues matérialisées créées
    console.log('Materialized views refresh skipped - views not yet created');
  }
} 