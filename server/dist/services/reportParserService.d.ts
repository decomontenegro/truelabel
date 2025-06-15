interface ParsedData {
    productName?: string;
    brand?: string;
    batchNumber?: string;
    manufactureDate?: string;
    expiryDate?: string;
    nutritionalInfo?: {
        calories?: number;
        protein?: number;
        carbohydrates?: number;
        fat?: number;
        fiber?: number;
        sodium?: number;
        [key: string]: any;
    };
    ingredients?: string[];
    allergens?: string[];
    certifications?: string[];
    analysisResults?: {
        [key: string]: any;
    };
}
export declare class ReportParserService {
    parsePDF(filePath: string): Promise<ParsedData>;
    private extractDataFromText;
    private extractNutritionalInfo;
    private extractIngredients;
    private extractAllergens;
    private extractCertifications;
    private parseDate;
    saveParsedData(reportId: string, parsedData: ParsedData): Promise<ParsedData>;
    parseReport(reportId: string): Promise<ParsedData>;
}
declare const _default: ReportParserService;
export default _default;
//# sourceMappingURL=reportParserService.d.ts.map