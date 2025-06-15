"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportParserService = void 0;
const client_1 = require("@prisma/client");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
class ReportParserService {
    async parsePDF(filePath) {
        try {
            const dataBuffer = fs_1.default.readFileSync(filePath);
            const data = await (0, pdf_parse_1.default)(dataBuffer);
            const text = data.text;
            return this.extractDataFromText(text);
        }
        catch (error) {
            console.error('Error parsing PDF:', error);
            throw new Error('Failed to parse PDF report');
        }
    }
    extractDataFromText(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const parsedData = {};
        const productNameMatch = text.match(/(?:produto|product|nome|name):\s*(.+)/i);
        if (productNameMatch) {
            parsedData.productName = productNameMatch[1].trim();
        }
        const brandMatch = text.match(/(?:marca|brand|fabricante|manufacturer):\s*(.+)/i);
        if (brandMatch) {
            parsedData.brand = brandMatch[1].trim();
        }
        const batchMatch = text.match(/(?:lote|batch|lot):\s*(.+)/i);
        if (batchMatch) {
            parsedData.batchNumber = batchMatch[1].trim();
        }
        const manufactureDateMatch = text.match(/(?:data de fabrica[çc][ãa]o|manufacture date|prod date):\s*(.+)/i);
        if (manufactureDateMatch) {
            parsedData.manufactureDate = this.parseDate(manufactureDateMatch[1]);
        }
        const expiryDateMatch = text.match(/(?:validade|expiry|expire|vencimento):\s*(.+)/i);
        if (expiryDateMatch) {
            parsedData.expiryDate = this.parseDate(expiryDateMatch[1]);
        }
        parsedData.nutritionalInfo = this.extractNutritionalInfo(text);
        parsedData.ingredients = this.extractIngredients(text);
        parsedData.allergens = this.extractAllergens(text);
        parsedData.certifications = this.extractCertifications(text);
        return parsedData;
    }
    extractNutritionalInfo(text) {
        const nutritionalInfo = {};
        const patterns = {
            calories: /(?:calorias|calories|kcal|energia|energy)[\s:]+(\d+(?:[.,]\d+)?)/i,
            protein: /(?:prote[íi]nas?|protein)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
            carbohydrates: /(?:carboidratos?|carbohydrates?|carbs)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
            fat: /(?:gorduras?\s+totais?|total\s+fat|lipids?)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
            fiber: /(?:fibras?|fiber|fibre)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
            sodium: /(?:s[óo]dio|sodium)[\s:]+(\d+(?:[.,]\d+)?)\s*mg/i,
            sugar: /(?:a[çc][úu]cares?|sugars?)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
            saturatedFat: /(?:gorduras?\s+saturadas?|saturated\s+fat)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
            transFat: /(?:gorduras?\s+trans|trans\s+fat)[\s:]+(\d+(?:[.,]\d+)?)\s*g/i,
        };
        for (const [key, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                nutritionalInfo[key] = parseFloat(match[1].replace(',', '.'));
            }
        }
        return nutritionalInfo;
    }
    extractIngredients(text) {
        const ingredients = [];
        const ingredientsMatch = text.match(/(?:ingredientes?|ingredients?):\s*(.+?)(?:\n|$)/i);
        if (ingredientsMatch) {
            const ingredientsList = ingredientsMatch[1];
            const items = ingredientsList.split(/[,;]/).map(item => item.trim()).filter(item => item);
            ingredients.push(...items);
        }
        return ingredients;
    }
    extractAllergens(text) {
        const allergens = [];
        const commonAllergens = [
            'leite', 'milk',
            'ovo', 'egg',
            'soja', 'soy',
            'trigo', 'wheat',
            'glúten', 'gluten',
            'amendoim', 'peanut',
            'castanha', 'nuts',
            'peixe', 'fish',
            'crustáceo', 'shellfish',
            'frutos do mar', 'seafood'
        ];
        const allergenMatch = text.match(/(?:al[ée]rgenos?|allergens?|cont[ée]m|contains):\s*(.+?)(?:\n|$)/i);
        if (allergenMatch) {
            const allergenText = allergenMatch[1].toLowerCase();
            for (const allergen of commonAllergens) {
                if (allergenText.includes(allergen.toLowerCase())) {
                    allergens.push(allergen);
                }
            }
        }
        return [...new Set(allergens)];
    }
    extractCertifications(text) {
        const certifications = [];
        const certPatterns = [
            /ISO\s*\d+/gi,
            /HACCP/gi,
            /BRC/gi,
            /IFS/gi,
            /SIF\s*\d+/gi,
            /org[âa]nico/gi,
            /organic/gi,
            /halal/gi,
            /kosher/gi,
            /vegano?/gi,
            /gluten[\s-]?free/gi,
        ];
        for (const pattern of certPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                certifications.push(...matches);
            }
        }
        return [...new Set(certifications)];
    }
    parseDate(dateStr) {
        const formats = [
            /(\d{2})\/(\d{2})\/(\d{4})/,
            /(\d{4})-(\d{2})-(\d{2})/,
            /(\d{2})-(\d{2})-(\d{4})/,
        ];
        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                if (format === formats[0] || format === formats[2]) {
                    return `${match[3]}-${match[2]}-${match[1]}`;
                }
                else {
                    return match[0];
                }
            }
        }
        return dateStr;
    }
    async saveParsedData(reportId, parsedData) {
        try {
            await prisma.report.update({
                where: { id: reportId },
                data: {
                    results: parsedData,
                    isParsed: true,
                    parsedAt: new Date()
                }
            });
            if (parsedData.nutritionalInfo && parsedData.productName) {
                const product = await prisma.product.findFirst({
                    where: {
                        OR: [
                            { name: parsedData.productName },
                            { brand: parsedData.brand || '' }
                        ]
                    }
                });
                if (product) {
                    await prisma.product.update({
                        where: { id: product.id },
                        data: {
                            nutritionalInfo: parsedData.nutritionalInfo
                        }
                    });
                }
            }
            return parsedData;
        }
        catch (error) {
            console.error('Error saving parsed data:', error);
            throw new Error('Failed to save parsed data');
        }
    }
    async parseReport(reportId) {
        const report = await prisma.report.findUnique({
            where: { id: reportId }
        });
        if (!report) {
            throw new Error('Report not found');
        }
        let parsedData = {};
        const fileExtension = path_1.default.extname(report.originalName).toLowerCase();
        if (fileExtension === '.pdf') {
            parsedData = await this.parsePDF(report.filePath);
        }
        else if (['.txt', '.csv'].includes(fileExtension)) {
            const text = fs_1.default.readFileSync(report.filePath, 'utf-8');
            parsedData = this.extractDataFromText(text);
        }
        else {
            throw new Error(`Unsupported file type: ${fileExtension}`);
        }
        await this.saveParsedData(reportId, parsedData);
        return parsedData;
    }
}
exports.ReportParserService = ReportParserService;
exports.default = new ReportParserService();
//# sourceMappingURL=reportParserService.js.map