import PDFDocument from 'pdfkit';
import { S3 } from 'aws-sdk';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';

// Initialize S3 if configured
const s3 = process.env.AWS_ACCESS_KEY_ID ? new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
}) : null;

export class PDFService {
  static async generateFullReport(validation: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Relatório Completo - ${validation.product.name}`,
          Author: 'TRUST LABEL',
          Subject: 'Relatório de Validação de Produto',
          Creator: 'TRUST LABEL Platform',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      this.addHeader(doc);

      // Title
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('Relatório de Validação', { align: 'center' })
         .moveDown();

      // Product Information
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Informações do Produto')
         .moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica')
         .text(`Nome: ${validation.product.name}`)
         .text(`Categoria: ${validation.product.category}`)
         .text(`Código EAN: ${validation.product.barcode}`)
         .text(`Marca: ${validation.product.brand.name}`)
         .moveDown();

      // Validation Summary
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Resumo da Validação')
         .moveDown(0.5);

      const summary = validation.summary || {};
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Total de Itens: ${summary.totalItems || 0}`)
         .text(`Itens Aprovados: ${summary.approvedItems || 0}`, { continued: true })
         .fillColor('green')
         .text(` ✓`, { continued: false })
         .fillColor('black')
         .text(`Itens com Ressalvas: ${summary.warningItems || 0}`, { continued: true })
         .fillColor('orange')
         .text(` ⚠`, { continued: false })
         .fillColor('black')
         .text(`Itens Reprovados: ${summary.rejectedItems || 0}`, { continued: true })
         .fillColor('red')
         .text(` ✗`, { continued: false })
         .fillColor('black')
         .moveDown();

      // AI Analysis
      if (validation.aiAnalysis) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Análise de Inteligência Artificial')
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Confiança: ${validation.aiAnalysis.confidence}%`)
           .text(`Score: ${validation.aiAnalysis.score}`)
           .text(`Recomendação: ${validation.aiAnalysis.recommendation}`)
           .moveDown();
      }

      // Categories
      doc.addPage();
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text('Resultados por Categoria')
         .moveDown();

      validation.categories.forEach((category: any) => {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(category.name)
           .moveDown(0.3);

        category.items.forEach((item: any) => {
          const color = item.status === 'approved' ? 'green' : 
                       item.status === 'warning' ? 'orange' : 'red';
          const symbol = item.status === 'approved' ? '✓' : 
                        item.status === 'warning' ? '⚠' : '✗';

          doc.fontSize(11)
             .font('Helvetica')
             .text(`• ${item.name}: ${item.value}`, { continued: true })
             .fillColor(color)
             .text(` ${symbol}`, { continued: false })
             .fillColor('black');

          if (item.note) {
            doc.fontSize(10)
               .fillColor('gray')
               .text(`  ${item.note}`, { indent: 20 })
               .fillColor('black');
          }
        });

        doc.moveDown();
      });

      // Laboratory Information
      if (validation.laboratory) {
        doc.addPage();
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Informações do Laboratório')
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Nome: ${validation.laboratory.name}`)
           .text(`CNPJ: ${validation.laboratory.cnpj}`)
           .text(`Acreditações: ${validation.laboratory.accreditation.join(', ')}`)
           .moveDown();
      }

      // QR Code
      if (validation.product.qrCodes?.[0]) {
        doc.addPage();
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('QR Code de Verificação', { align: 'center' })
           .moveDown();

        // Generate QR code as base64
        QRCode.toDataURL(validation.product.qrCodes[0].fullUrl)
          .then(url => {
            const img = Buffer.from(url.split(',')[1], 'base64');
            doc.image(img, doc.page.width / 2 - 100, doc.y, { width: 200 });
            doc.moveDown(10);
            doc.fontSize(10)
               .font('Helvetica')
               .text(`ID: ${validation.product.qrCodes[0].code}`, { align: 'center' });
          });
      }

      // Footer
      this.addFooter(doc, validation);

      doc.end();
    });
  }

  static async generateSummaryReport(validation: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      this.addHeader(doc);

      // Title
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('Resumo de Validação', { align: 'center' })
         .moveDown(2);

      // Product Info Box
      const boxTop = doc.y;
      doc.rect(50, boxTop, doc.page.width - 100, 100)
         .stroke();

      doc.y = boxTop + 10;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(validation.product.name, 60, doc.y)
         .fontSize(12)
         .font('Helvetica')
         .text(`EAN: ${validation.product.barcode}`)
         .text(`Marca: ${validation.product.brand.name}`)
         .text(`Data: ${new Date(validation.validatedAt).toLocaleDateString('pt-BR')}`);

      doc.y = boxTop + 110;
      doc.moveDown();

      // Status
      const statusColor = validation.status === 'VALIDATED' ? 'green' :
                         validation.status === 'VALIDATED_WITH_REMARKS' ? 'orange' : 'red';
      const statusText = validation.status === 'VALIDATED' ? 'APROVADO' :
                        validation.status === 'VALIDATED_WITH_REMARKS' ? 'APROVADO COM RESSALVAS' : 'REPROVADO';

      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor(statusColor)
         .text(`Status: ${statusText}`, { align: 'center' })
         .fillColor('black')
         .moveDown();

      // Summary Stats
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Confiança AI: ${validation.aiAnalysis?.confidence || 0}%`, { align: 'center' })
         .text(`Score: ${validation.aiAnalysis?.score || 'N/A'}`, { align: 'center' })
         .moveDown(2);

      // Category Summary
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Resumo por Categoria')
         .moveDown();

      validation.categories.forEach((category: any) => {
        const categoryColor = category.status === 'approved' ? 'green' :
                            category.status === 'warning' ? 'orange' : 'red';
        const categorySymbol = category.status === 'approved' ? '✓' :
                              category.status === 'warning' ? '⚠' : '✗';

        doc.fontSize(12)
           .font('Helvetica')
           .text(`${category.name}: `, { continued: true })
           .fillColor(categoryColor)
           .text(`${categorySymbol} ${category.status.toUpperCase()}`)
           .fillColor('black');
      });

      // Footer
      this.addFooter(doc, validation);

      doc.end();
    });
  }

  static async generateCertificate(validation: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        layout: 'landscape',
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(3)
         .stroke();

      // Header
      doc.fontSize(36)
         .font('Helvetica-Bold')
         .text('CERTIFICADO DE VALIDAÇÃO', 0, 80, { align: 'center' })
         .moveDown();

      doc.fontSize(24)
         .font('Helvetica')
         .text('TRUST LABEL', { align: 'center' })
         .moveDown(2);

      // Certificate Text
      doc.fontSize(16)
         .font('Helvetica')
         .text('Certificamos que o produto', { align: 'center' })
         .moveDown();

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(validation.product.name, { align: 'center' })
         .moveDown();

      doc.fontSize(16)
         .font('Helvetica')
         .text(`da marca ${validation.product.brand.name}`, { align: 'center' })
         .moveDown()
         .text('foi validado e está em conformidade com os padrões', { align: 'center' })
         .text('estabelecidos pela plataforma TRUST LABEL.', { align: 'center' })
         .moveDown(2);

      // Validation Details
      doc.fontSize(14)
         .text(`Código de Validação: ${validation.id}`, { align: 'center' })
         .text(`Data de Validação: ${new Date(validation.validatedAt).toLocaleDateString('pt-BR')}`, { align: 'center' })
         .text(`Validade: ${new Date(validation.validUntil).toLocaleDateString('pt-BR')}`, { align: 'center' })
         .moveDown(3);

      // Signature
      doc.fontSize(12)
         .text('_______________________________', doc.page.width / 2 - 100, doc.page.height - 150)
         .text('TRUST LABEL', doc.page.width / 2 - 40, doc.page.height - 130)
         .text('Plataforma de Validação', doc.page.width / 2 - 60, doc.page.height - 110);

      doc.end();
    });
  }

  private static addHeader(doc: PDFKit.PDFDocument) {
    // Logo placeholder
    doc.rect(50, 40, 40, 40)
       .fill('black');
    
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('black')
       .text('TRUST', 100, 45)
       .font('Helvetica')
       .text('LABEL', 175, 45);

    doc.fontSize(10)
       .text('AI-Powered CPG Validation Platform', 100, 65)
       .moveDown(2);

    // Line separator
    doc.moveTo(50, 90)
       .lineTo(doc.page.width - 50, 90)
       .stroke();

    doc.moveDown(2);
  }

  private static addFooter(doc: PDFKit.PDFDocument, validation: any) {
    const bottomMargin = 50;
    const pageHeight = doc.page.height;

    // Line separator
    doc.moveTo(50, pageHeight - bottomMargin - 20)
       .lineTo(doc.page.width - 50, pageHeight - bottomMargin - 20)
       .stroke();

    doc.fontSize(10)
       .fillColor('gray')
       .text(
         `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
         50,
         pageHeight - bottomMargin,
         { align: 'left', width: doc.page.width - 100 }
       )
       .text(
         `trustlabel.com`,
         50,
         pageHeight - bottomMargin,
         { align: 'right', width: doc.page.width - 100 }
       );
  }

  static async saveReport(buffer: Buffer, filename: string): Promise<string> {
    try {
      if (s3 && process.env.AWS_S3_BUCKET) {
        // Upload to S3
        const key = `reports/${Date.now()}-${filename}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: 'application/pdf',
          ContentDisposition: `attachment; filename="${filename}"`,
        };

        const result = await s3.upload(params).promise();
        logger.info(`Report uploaded to S3: ${result.Location}`);
        return result.Location;
      } else {
        // Save locally
        const dir = path.join(__dirname, '../../../uploads/reports');
        await fs.mkdir(dir, { recursive: true });
        const filepath = path.join(dir, filename);
        await fs.writeFile(filepath, buffer);
        logger.info(`Report saved locally: ${filepath}`);
        return `/uploads/reports/${filename}`;
      }
    } catch (error) {
      logger.error('Failed to save report:', error);
      throw error;
    }
  }
}