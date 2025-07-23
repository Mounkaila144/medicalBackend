import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    private dataSource: DataSource,
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

  async getDashboardData(tenantId: string, period: string = 'MONTHLY') {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Récupérer les statistiques principales
      const [
        totalPatients,
        todayAppointments,
        pendingInvoices,
        monthlyRevenue,
        appointmentsByStatus,
        recentAppointments,
        upcomingAppointments,
        appointmentsOverview
      ] = await Promise.all([
        this.getTotalPatients(tenantId),
        this.getTodayAppointments(tenantId),
        this.getPendingInvoices(tenantId),
        this.getMonthlyRevenue(tenantId),
        this.getAppointmentsByStatus(tenantId, startOfDay, endOfDay),
        this.getRecentAppointments(tenantId, 5),
        this.getUpcomingAppointments(tenantId, startOfDay, endOfDay),
        this.getAppointmentsOverview(tenantId, period)
      ]);

      return {
        period,
        tenantId,
        metrics: {
          totalPatients,
          totalAppointments: todayAppointments.length,
          totalRevenue: monthlyRevenue,
          averageWaitTime: 15
        },
        appointmentsByStatus,
        recentAppointments,
        upcomingAppointments,
        appointmentsOverview,
        pendingInvoices,
        alerts: await this.getAlerts(tenantId)
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  private async getTotalPatients(tenantId: string): Promise<number> {
    const result = await this.dataSource.query(`
      SELECT COUNT(*) as count
      FROM patients 
      WHERE clinic_id = ?
    `, [tenantId]);
    return parseInt(result[0]?.count || 0);
  }

  private async getTodayAppointments(tenantId: string): Promise<any[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return await this.dataSource.query(`
      SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
             pr.first_name as practitioner_first_name, pr.last_name as practitioner_last_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN practitioners pr ON a.practitioner_id = pr.id
      WHERE a.tenant_id = ? 
        AND a.start_at >= ? 
        AND a.start_at <= ?
      ORDER BY a.start_at ASC
    `, [tenantId, startOfDay, endOfDay]);
  }

  private async getPendingInvoices(tenantId: string): Promise<number> {
    const result = await this.dataSource.query(`
      SELECT COUNT(*) as count
      FROM invoices 
      WHERE tenant_id = ? AND status = 'PENDING'
    `, [tenantId]);
    return parseInt(result[0]?.count || 0);
  }

  private async getMonthlyRevenue(tenantId: string): Promise<number> {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const result = await this.dataSource.query(`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE i.tenant_id = ? 
        AND p.paid_at >= ? 
        AND p.paid_at <= ?
    `, [tenantId, startOfMonth, endOfMonth]);
    return parseFloat(result[0]?.total || 0);
  }

  private async getAppointmentsByStatus(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    const result = await this.dataSource.query(`
      SELECT status, COUNT(*) as count
      FROM appointments 
      WHERE tenant_id = ? 
        AND start_at >= ? 
        AND start_at <= ?
      GROUP BY status
    `, [tenantId, startDate, endDate]);

    const statusCounts = {
      BOOKED: 0,
      CANCELLED: 0,
      DONE: 0,
      NO_SHOW: 0
    };

    result.forEach(row => {
      if (statusCounts.hasOwnProperty(row.status)) {
        statusCounts[row.status] = parseInt(row.count);
      }
    });

    return statusCounts;
  }

  private async getRecentAppointments(tenantId: string, limit: number = 5): Promise<any[]> {
    return await this.dataSource.query(`
      SELECT a.id, a.status, a.start_at as appointmentDate, a.reason as purpose,
             CONCAT(p.first_name, ' ', p.last_name) as patientName,
             CONCAT(pr.first_name, ' ', pr.last_name) as practitionerName
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN practitioners pr ON a.practitioner_id = pr.id
      WHERE a.tenant_id = ?
      ORDER BY a.start_at DESC
      LIMIT ?
    `, [tenantId, limit]);
  }

  private async getUpcomingAppointments(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return await this.dataSource.query(`
      SELECT a.id, a.start_at as appointmentDate, a.reason as purpose,
             CONCAT(p.first_name, ' ', p.last_name) as patient,
             CONCAT(pr.first_name, ' ', pr.last_name) as practitioner,
             'Consultation' as type
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN practitioners pr ON a.practitioner_id = pr.id
      WHERE a.tenant_id = ? 
        AND a.start_at >= ? 
        AND a.start_at <= ?
        AND a.status IN ('BOOKED')
      ORDER BY a.start_at ASC
      LIMIT 10
    `, [tenantId, startDate, endDate]);
  }

  private async getAppointmentsOverview(tenantId: string, period: string): Promise<any[]> {
    const daysBack = period === 'WEEKLY' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    return await this.dataSource.query(`
      SELECT DATE(start_at) as date,
             SUM(CASE WHEN status = 'BOOKED' THEN 1 ELSE 0 END) as scheduled,
             SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as completed,
             SUM(CASE WHEN status IN ('CANCELLED', 'NO_SHOW') THEN 1 ELSE 0 END) as canceled
      FROM appointments 
      WHERE tenant_id = ? 
        AND start_at >= ?
      GROUP BY DATE(start_at)
      ORDER BY date DESC
      LIMIT ?
    `, [tenantId, startDate, daysBack]);
  }

  private async getAlerts(tenantId: string): Promise<any[]> {
    const alerts: any[] = [];

    // Vérifier les factures en retard
    const overdueInvoices = await this.dataSource.query(`
      SELECT COUNT(*) as count
      FROM invoices 
      WHERE tenant_id = ? 
        AND status = 'PENDING' 
        AND due_at < CURRENT_DATE
    `, [tenantId]);

    if (parseInt(overdueInvoices[0]?.count || 0) > 0) {
      alerts.push({
        id: 'overdue-invoices',
        type: 'warning',
        message: `${overdueInvoices[0].count} facture(s) en retard de paiement`,
        action: 'Voir les factures'
      });
    }

    // Vérifier les nouveaux patients cette semaine
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const newPatients = await this.dataSource.query(`
      SELECT COUNT(*) as count
      FROM patients 
      WHERE clinic_id = ? 
        AND created_at >= ?
    `, [tenantId, weekStart]);

    if (parseInt(newPatients[0]?.count || 0) > 0) {
      alerts.push({
        id: 'new-patients',
        type: 'info',
        message: `${newPatients[0].count} nouveau(x) patient(s) cette semaine`,
        action: 'Voir les patients'
      });
    }

    return alerts;
  }
} 