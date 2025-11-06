import { emailService } from './email-service';
import { prisma } from '../db';
import type { EmailNotification, InsertEmailNotification } from '@shared/schema';

interface QueuedEmail {
  id: string;
  to: string | string[];
  subject: string;
  template?: string;
  data?: Record<string, any>;
  html?: string;
  text?: string;
  retries: number;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

class EmailQueue {
  private queue: QueuedEmail[] = [];
  private processing = false;
  private processInterval: NodeJS.Timeout | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT = 100; // emails per minute
  private readonly BATCH_SIZE = 10; // process 10 emails at a time
  private lastProcessTime = 0;

  constructor() {
    // Start processing queue
    this.startProcessing();
  }

  /**
   * Add email to queue
   */
  async add(email: Omit<QueuedEmail, 'id' | 'retries' | 'status' | 'createdAt'>): Promise<string> {
    const queuedEmail: QueuedEmail = {
      ...email,
      id: this.generateId(),
      retries: 0,
      status: 'pending',
      createdAt: new Date()
    };

    this.queue.push(queuedEmail);

    // Log to database if available
    try {
      await this.logEmailNotification({
        type: 'queued',
        recipient: Array.isArray(email.to) ? email.to.join(', ') : email.to,
        subject: email.subject,
        status: 'pending',
        metadata: {
          template: email.template,
          queueId: queuedEmail.id
        }
      });
    } catch (error) {
      console.error('Failed to log email to database:', error);
    }

    return queuedEmail.id;
  }

  /**
   * Start processing emails from queue
   */
  private startProcessing(): void {
    if (this.processInterval) return;

    // Process queue every second
    this.processInterval = setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  /**
   * Process emails from queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    
    // Check rate limit
    const now = Date.now();
    const timeSinceLastProcess = now - this.lastProcessTime;
    const minTimeBetweenBatches = 60000 / (this.RATE_LIMIT / this.BATCH_SIZE); // milliseconds
    
    if (timeSinceLastProcess < minTimeBetweenBatches) {
      return; // Rate limit exceeded
    }

    // Get pending emails
    const pendingEmails = this.queue
      .filter(e => e.status === 'pending')
      .slice(0, this.BATCH_SIZE);

    if (pendingEmails.length === 0) return;

    this.processing = true;
    this.lastProcessTime = now;

    // Process emails in parallel
    const promises = pendingEmails.map(email => this.processEmail(email));
    await Promise.allSettled(promises);

    // Clean up processed emails
    this.cleanupQueue();

    this.processing = false;
  }

  /**
   * Process individual email
   */
  private async processEmail(email: QueuedEmail): Promise<void> {
    email.status = 'processing';

    try {
      // Send email using email service
      await emailService.sendEmail({
        to: email.to,
        subject: email.subject,
        template: email.template,
        data: email.data,
        html: email.html,
        text: email.text
      });

      // Mark as sent
      email.status = 'sent';
      email.processedAt = new Date();

      // Log success to database
      await this.logEmailNotification({
        type: 'sent',
        recipient: Array.isArray(email.to) ? email.to.join(', ') : email.to,
        subject: email.subject,
        status: 'sent',
        sentAt: email.processedAt,
        metadata: {
          template: email.template,
          queueId: email.id,
          processTime: email.processedAt.getTime() - email.createdAt.getTime()
        }
      });

      console.log(`✅ Email sent successfully: ${email.id}`);

    } catch (error: any) {
      email.retries++;
      email.error = error.message || 'Unknown error';

      if (email.retries >= this.MAX_RETRIES) {
        // Max retries reached, mark as failed
        email.status = 'failed';
        email.processedAt = new Date();

        // Log failure to database
        await this.logEmailNotification({
          type: 'failed',
          recipient: Array.isArray(email.to) ? email.to.join(', ') : email.to,
          subject: email.subject,
          status: 'failed',
          error: email.error,
          metadata: {
            template: email.template,
            queueId: email.id,
            retries: email.retries
          }
        });

        console.error(`❌ Email failed after ${email.retries} retries: ${email.id}`, error);
      } else {
        // Reset status to pending for retry
        email.status = 'pending';
        console.warn(`⚠️ Email failed, will retry (${email.retries}/${this.MAX_RETRIES}): ${email.id}`);
      }
    }
  }

  /**
   * Clean up processed emails from queue
   */
  private cleanupQueue(): void {
    // Remove sent and failed emails older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    this.queue = this.queue.filter(email => {
      if (email.status === 'sent' || email.status === 'failed') {
        return email.processedAt && email.processedAt > oneHourAgo;
      }
      return true; // Keep pending and processing emails
    });
  }

  /**
   * Log email notification to database
   */
  private async logEmailNotification(data: {
    type: string;
    recipient: string;
    subject: string;
    status: string;
    sentAt?: Date;
    error?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const notification: InsertEmailNotification = {
        type: data.type as any,
        recipient: data.recipient,
        subject: data.subject,
        content: '', // Content is stored separately in templates
        status: data.status as 'pending' | 'sent' | 'failed',
        sentAt: data.sentAt,
        error: data.error,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      };

      // Check if database is available
      const isDbConnected = await prisma.$queryRaw`SELECT 1`;
      if (isDbConnected) {
        await prisma.emailNotification.create({
          data: notification as any
        });
      }
    } catch (error) {
      // Silently fail if database is not available
      console.debug('Could not log email notification to database:', error);
    }
  }

  /**
   * Generate unique ID for queued email
   */
  private generateId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  } {
    const stats = {
      total: this.queue.length,
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0
    };

    for (const email of this.queue) {
      stats[email.status]++;
    }

    return stats;
  }

  /**
   * Get emails by status
   */
  getEmailsByStatus(status: QueuedEmail['status']): QueuedEmail[] {
    return this.queue.filter(e => e.status === status);
  }

  /**
   * Clear all failed emails
   */
  clearFailed(): void {
    this.queue = this.queue.filter(e => e.status !== 'failed');
  }

  /**
   * Retry all failed emails
   */
  retryFailed(): void {
    const failedEmails = this.queue.filter(e => e.status === 'failed');
    
    for (const email of failedEmails) {
      email.status = 'pending';
      email.retries = 0;
      email.error = undefined;
      email.processedAt = undefined;
    }

    console.log(`Retrying ${failedEmails.length} failed emails`);
  }

  /**
   * Stop processing queue
   */
  stop(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }
}

// Export singleton instance
export const emailQueue = new EmailQueue();

// Helper functions for common email types
export async function queueWelcomeEmail(user: {
  email: string;
  name?: string;
  username?: string;
  subscribeToNewPosts?: boolean;
}): Promise<string> {
  return emailQueue.add({
    to: user.email,
    subject: 'Welcome to ForexFactory - Your Free Forex Resources Await!',
    template: 'welcome',
    data: {
      userName: user.name || user.username || user.email.split('@')[0],
      subscribed: user.subscribeToNewPosts || false
    }
  });
}

export async function queueVerificationEmail(user: {
  email: string;
  name?: string;
}, token: string): Promise<string> {
  return emailQueue.add({
    to: user.email,
    subject: 'Verify Your Email - ForexFactory',
    template: 'email-verification',
    data: {
      userName: user.name || user.email.split('@')[0],
      verificationUrl: `${process.env.SITE_URL || 'https://forexfactory.cc'}/verify-email?token=${token}`,
      validFor: '24 hours'
    }
  });
}

export async function queueNewPostNotification(
  post: {
    title: string;
    excerpt?: string;
    slug: string;
    thumbnail?: string;
    hasDownload?: boolean;
  },
  subscribers: Array<{ email: string; name?: string }>
): Promise<void> {
  for (const subscriber of subscribers) {
    await emailQueue.add({
      to: subscriber.email,
      subject: `New: ${post.title} - ForexFactory`,
      template: 'blog-notification',
      data: {
        userName: subscriber.name || 'Subscriber',
        postTitle: post.title,
        postExcerpt: post.excerpt,
        postUrl: `${process.env.SITE_URL || 'https://forexfactory.cc'}/blog/${post.slug}`,
        postImage: post.thumbnail,
        hasDownload: post.hasDownload || false
      }
    });
  }
}

export default emailQueue;