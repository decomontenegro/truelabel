import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { ClaimExtractorService } from './services/claim-extractor.service';
import { ReportParserService } from './services/report-parser.service';
import { ValidationMatcherService } from './services/validation-matcher.service';
import { AnomalyDetectorService } from './services/anomaly-detector.service';
import { AIProcessor } from './processors/ai.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-analysis',
    }),
  ],
  controllers: [AIController],
  providers: [
    AIService,
    ClaimExtractorService,
    ReportParserService,
    ValidationMatcherService,
    AnomalyDetectorService,
    AIProcessor,
  ],
  exports: [AIService],
})
export class AIModule {}