export declare class EmailService {
    private transporter;
    constructor();
    sendEmail(to: string, subject: string, html: string): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: unknown;
        messageId?: undefined;
    }>;
    notifyReportUploaded(reportId: string): Promise<void>;
    notifyValidationApproved(validationId: string): Promise<void>;
    notifyValidationRejected(validationId: string, rejectionReason?: string): Promise<void>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=emailService.d.ts.map