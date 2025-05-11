import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from '../entities/prescription.entity';
import { CreatePrescriptionDto } from '../dto/create-prescription.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrescriptionGeneratedEvent } from '../events/prescription-generated.event';
import { EncountersService } from './encounters.service';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private prescriptionsRepository: Repository<Prescription>,
    private encountersService: EncountersService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(tenantId: string, createPrescriptionDto: CreatePrescriptionDto): Promise<Prescription> {
    // Vérifier que la consultation existe
    const encounter = await this.encountersService.findOne(createPrescriptionDto.encounterId);
    
    if (encounter.tenantId !== tenantId) {
      throw new NotFoundException('Consultation non trouvée');
    }

    // Créer la prescription
    const prescription = this.prescriptionsRepository.create({
      encounterId: createPrescriptionDto.encounterId,
      practitionerId: createPrescriptionDto.practitionerId,
      expiresAt: createPrescriptionDto.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Par défaut, 30 jours
    });
    
    const savedPrescription = await this.prescriptionsRepository.save(prescription);
    
    // Générer le PDF et le QR code
    const pdfInfo = await this.generatePdf(savedPrescription, createPrescriptionDto);
    
    // Mettre à jour la prescription avec les chemins des fichiers générés
    savedPrescription.pdfPath = pdfInfo.pdfPath;
    savedPrescription.qr = pdfInfo.qrPath;
    
    const updatedPrescription = await this.prescriptionsRepository.save(savedPrescription);
    
    // Émettre l'événement de génération de prescription
    this.eventEmitter.emit('prescription.generated', new PrescriptionGeneratedEvent(updatedPrescription));
    
    return updatedPrescription;
  }

  async findAll(tenantId: string): Promise<Prescription[]> {
    // Récupérer toutes les prescriptions pour le tenant donné
    return this.prescriptionsRepository
      .createQueryBuilder('prescription')
      .innerJoin('prescription.encounter', 'encounter')
      .where('encounter.tenantId = :tenantId', { tenantId })
      .getMany();
  }

  async findOne(id: string): Promise<Prescription> {
    const prescription = await this.prescriptionsRepository.findOne({
      where: { id },
      relations: ['encounter', 'practitioner', 'encounter.patient'],
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription avec ID ${id} non trouvée`);
    }

    return prescription;
  }

  private async generatePdf(
    prescription: Prescription, 
    createPrescriptionDto: CreatePrescriptionDto
  ): Promise<{ pdfPath: string; qrPath: string }> {
    // Créer les répertoires si nécessaires
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const prescriptionsDir = path.join(uploadsDir, 'prescriptions');
    const qrCodesDir = path.join(uploadsDir, 'qrcodes');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    
    if (!fs.existsSync(prescriptionsDir)) {
      fs.mkdirSync(prescriptionsDir);
    }
    
    if (!fs.existsSync(qrCodesDir)) {
      fs.mkdirSync(qrCodesDir);
    }
    
    // Générer le QR code pour la vérification de la prescription
    const qrPath = path.join(qrCodesDir, `${prescription.id}.png`);
    await QRCode.toFile(qrPath, JSON.stringify({
      prescriptionId: prescription.id,
      encounterId: prescription.encounterId,
      timestamp: new Date().toISOString(),
    }));
    
    // Générer le PDF de la prescription
    const pdfPath = path.join(prescriptionsDir, `${prescription.id}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(pdfPath);
    
    doc.pipe(stream);
    
    // Ajouter le contenu au PDF
    doc.fontSize(18).text('Prescription Médicale', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    
    // Ajouter les médicaments et posologies
    doc.fontSize(14).text('Médicaments prescrits:');
    doc.moveDown();
    
    createPrescriptionDto.items.forEach((item, index) => {
      doc.fontSize(12).text(`${index + 1}. ${item.medication}`);
      doc.fontSize(10).text(`   Dosage: ${item.dosage}`);
      doc.fontSize(10).text(`   Fréquence: ${item.frequency}`);
      
      if (item.duration) {
        doc.fontSize(10).text(`   Durée: ${item.duration}`);
      }
      
      if (item.instructions) {
        doc.fontSize(10).text(`   Instructions: ${item.instructions}`);
      }
      
      doc.moveDown();
    });
    
    // Ajouter l'expiration
    doc.moveDown();
    doc.fontSize(12).text(`Valable jusqu'au: ${prescription.expiresAt.toLocaleDateString()}`);
    
    // Ajouter l'image QR code
    doc.moveDown();
    doc.image(qrPath, {
      fit: [100, 100],
      align: 'right',
    });
    
    // Finaliser le document
    doc.end();
    
    // Attendre que l'écriture du fichier soit terminée
    await new Promise<void>((resolve) => {
      stream.on('finish', () => resolve());
    });
    
    return { pdfPath, qrPath };
  }
} 