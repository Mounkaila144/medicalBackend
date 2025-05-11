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
    const { reportType, name, params, format = ReportFormat.PDF } = generateReportDto;
    
    // Récupérer les données selon le type de rapport
    const data = await this.fetchReportData(tenantId, reportType, params);
    
    // Générer le fichier
    const filePath = await this.generateFile(tenantId, name, data, format);
    
    // Créer l'entrée de rapport dans la base de données
    const report = this.reportRepository.create({
      tenantId,
      name,
      params,
      generatedPath: filePath,
      format,
    });
    
    return this.reportRepository.save(report);
  }

  private async fetchReportData(
    tenantId: string,
    reportType: ReportType,
    params: Record<string, any>,
  ): Promise<any[]> {
    const { startDate, endDate, practitionerId } = params;
    
    let query: string;
    
    switch (reportType) {
      case ReportType.DAILY_REVENUE:
        query = `
          SELECT * FROM daily_revenue
          WHERE tenant_id = '${tenantId}'
          AND date BETWEEN '${startDate}' AND '${endDate}'
          ORDER BY date
        `;
        break;
        
      case ReportType.PRACTITIONER_KPI:
        query = `
          SELECT * FROM practitioner_kpi
          WHERE tenant_id = '${tenantId}'
          ${practitionerId ? `AND practitioner_id = '${practitionerId}'` : ''}
        `;
        break;
        
      case ReportType.OCCUPANCY_RATE:
        query = `
          SELECT * FROM occupancy_rate
          WHERE tenant_id = '${tenantId}'
          ${practitionerId ? `AND practitioner_id = '${practitionerId}'` : ''}
          AND date BETWEEN '${startDate}' AND '${endDate}'
          ORDER BY date
        `;
        break;
        
      default:
        throw new NotFoundException(`Report type ${reportType} not supported`);
    }
    
    // Exécuter la requête SQL brute
    const result = await this.reportRepository.query(query);
    return result;
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
    await this.reportRepository.query('REFRESH MATERIALIZED VIEW daily_revenue');
    await this.reportRepository.query('REFRESH MATERIALIZED VIEW practitioner_kpi');
    await this.reportRepository.query('REFRESH MATERIALIZED VIEW occupancy_rate');
  }
} 