import { Job } from 'bull';
import { sendEmail } from '../../email.service';
import { logger } from '../../../utils/logger';

export async function emailProcessor(job: Job) {
  const emailData = job.data;

  try {
    logger.info(`Processing email job: ${emailData.subject} to ${emailData.to}`);

    await sendEmail(emailData);

    return {
      sent: true,
      to: emailData.to,
      subject: emailData.subject,
    };
  } catch (error) {
    logger.error('Email processing failed:', error);
    throw error;
  }
}