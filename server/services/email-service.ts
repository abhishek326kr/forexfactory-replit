import nodemailer, { type Transporter, type SendMailOptions } from 'nodemailer';
import { compile } from 'handlebars';
import { readFile } from 'fs/promises';
import path from 'path';
import Bull from 'bull';
import mjml2html from 'mjml';
import type { User, Blog, Signal } from '@shared/schema';

interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

interface BulkEmailOptions {
  recipients: Array<{ email: string; data?: Record<string, any> }>;
  subject: string;
  template: string;
  globalData?: Record<string, any>;
  batchSize?: number;
  delayBetweenBatches?: number;
}

interface EmailJobData {
  type: 'single' | 'bulk';
  options: EmailOptions | BulkEmailOptions;
}

class EmailService {
  private transporter: Transporter | null = null;
  private emailQueue: Bull.Queue<EmailJobData> | null = null;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private mjmlTemplates: Map<string, string> = new Map();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize email service with SMTP configuration
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Configure SMTP transporter
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        } : undefined
      };

      // Create transporter only if SMTP credentials are provided
      if (smtpConfig.auth) {
        this.transporter = nodemailer.createTransport(smtpConfig);

        // Verify connection
        await this.transporter!.verify();
        console.log('✅ Email service connected successfully');
      } else {
        console.warn('⚠️ SMTP credentials not configured. Email service will run in test mode.');
        // Create test account for development
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      // Initialize Bull queue for email jobs
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      try {
        this.emailQueue = new Bull('email-queue', redisUrl);
        
        // Process email jobs
        this.emailQueue.process(async (job) => {
          const { type, options } = job.data;
          
          if (type === 'single') {
            await this.sendSingleEmail(options as EmailOptions);
          } else if (type === 'bulk') {
            await this.processBulkEmails(options as BulkEmailOptions);
          }
        });

        // Handle queue events
        this.emailQueue.on('completed', (job) => {
          console.log(`Email job ${job.id} completed`);
        });

        this.emailQueue.on('failed', (job, err) => {
          console.error(`Email job ${job?.id} failed:`, err);
        });

        console.log('✅ Email queue initialized');
      } catch (error) {
        console.warn('⚠️ Redis not available. Email queue disabled. Emails will be sent synchronously.');
      }

      // Load email templates
      await this.loadTemplates();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * Load and compile email templates
   */
  private async loadTemplates(): Promise<void> {
    const templatesDir = path.join(process.cwd(), 'server', 'templates', 'email');
    const templateFiles = [
      'password-reset.hbs',
      'newsletter.hbs',
      'welcome.hbs',
      'blog-notification.hbs',
      'signal-alert.hbs',
      'download-confirmation.hbs',
      'subscription-confirmation.hbs',
      'subscription-expiry.hbs'
    ];

    for (const file of templateFiles) {
      try {
        const templatePath = path.join(templatesDir, file);
        const templateContent = await readFile(templatePath, 'utf-8');
        const templateName = path.basename(file, '.hbs');
        
        // Check if it's an MJML template
        if (templateContent.includes('<mjml>')) {
          const { html } = mjml2html(templateContent);
          this.mjmlTemplates.set(templateName, html);
          this.templates.set(templateName, compile(html));
        } else {
          this.templates.set(templateName, compile(templateContent));
        }
        
        console.log(`Loaded email template: ${templateName}`);
      } catch (error) {
        console.warn(`Failed to load template ${file}:`, error);
      }
    }
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    await this.initialize();

    if (this.emailQueue) {
      // Add to queue for async processing
      await this.emailQueue.add({
        type: 'single',
        options
      });
    } else {
      // Send synchronously if queue is not available
      await this.sendSingleEmail(options);
    }
  }

  /**
   * Internal method to send single email
   */
  private async sendSingleEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    let html = options.html;
    
    // Compile template if provided
    if (options.template && options.data) {
      const template = this.templates.get(options.template);
      if (template) {
        html = template(options.data);
      } else {
        throw new Error(`Template '${options.template}' not found`);
      }
    }

    const mailOptions: SendMailOptions = {
      from: options.from || process.env.EMAIL_FROM || 'noreply@forexeahub.com',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html,
      text: options.text,
      attachments: options.attachments,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc
    };

    const info = await this.transporter.sendMail(mailOptions);
    
    // Log preview URL for test emails
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(options: BulkEmailOptions): Promise<void> {
    await this.initialize();

    if (this.emailQueue) {
      // Add to queue for async processing
      await this.emailQueue.add({
        type: 'bulk',
        options
      }, {
        delay: 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
    } else {
      // Process synchronously if queue is not available
      await this.processBulkEmails(options);
    }
  }

  /**
   * Internal method to process bulk emails
   */
  private async processBulkEmails(options: BulkEmailOptions): Promise<void> {
    const batchSize = options.batchSize || 50;
    const delayBetweenBatches = options.delayBetweenBatches || 1000;
    
    const template = this.templates.get(options.template);
    if (!template) {
      throw new Error(`Template '${options.template}' not found`);
    }

    // Process recipients in batches
    for (let i = 0; i < options.recipients.length; i += batchSize) {
      const batch = options.recipients.slice(i, i + batchSize);
      
      // Send emails in parallel within batch
      const promises = batch.map(recipient => {
        const data = {
          ...options.globalData,
          ...recipient.data
        };
        
        return this.sendSingleEmail({
          to: recipient.email,
          subject: options.subject,
          html: template(data)
        });
      });

      await Promise.allSettled(promises);

      // Delay between batches to avoid rate limits
      if (i + batchSize < options.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.SITE_URL || 'https://forexeahub.com'}/reset-password?token=${resetToken}`;
    
    await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Forex EA Hub',
      template: 'password-reset',
      data: {
        userName: user.username || user.email,
        resetUrl,
        validFor: '1 hour',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@forexeahub.com'
      }
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: User): Promise<void> {
    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Forex EA Hub!',
      template: 'welcome',
      data: {
        userName: user.username || user.email,
        loginUrl: `${process.env.SITE_URL || 'https://forexeahub.com'}/login`,
        downloadsUrl: `${process.env.SITE_URL || 'https://forexeahub.com'}/downloads`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@forexeahub.com'
      }
    });
  }

  /**
   * Send newsletter
   */
  async sendNewsletter(
    recipients: Array<{ email: string; name?: string }>,
    subject: string,
    content: string,
    featuredPosts?: Blog[]
  ): Promise<void> {
    await this.sendBulkEmails({
      recipients: recipients.map(r => ({
        email: r.email,
        data: { userName: r.name || 'Subscriber' }
      })),
      subject,
      template: 'newsletter',
      globalData: {
        content,
        featuredPosts: featuredPosts?.map(post => ({
          title: post.title,
          excerpt: post.content.substring(0, 150),
          url: `${process.env.SITE_URL || 'https://forexeahub.com'}/blog/${post.seoSlug}`,
          image: post.featuredImage
        })),
        unsubscribeUrl: `${process.env.SITE_URL || 'https://forexeahub.com'}/unsubscribe`,
        currentYear: new Date().getFullYear()
      }
    });
  }

  /**
   * Send blog notification
   */
  async sendBlogNotification(blog: Blog, subscribers: string[]): Promise<void> {
    await this.sendBulkEmails({
      recipients: subscribers.map(email => ({ email })),
      subject: `New Post: ${blog.title}`,
      template: 'blog-notification',
      globalData: {
        postTitle: blog.title,
        postExcerpt: blog.content.substring(0, 200),
        postUrl: `${process.env.SITE_URL || 'https://forexeahub.com'}/blog/${blog.seoSlug}`,
        postImage: blog.featuredImage,
        author: blog.author,
        category: blog.categoryId,
        unsubscribeUrl: `${process.env.SITE_URL || 'https://forexeahub.com'}/unsubscribe`
      }
    });
  }

  /**
   * Send signal alert
   */
  async sendSignalAlert(signal: Signal, subscribers: string[]): Promise<void> {
    await this.sendBulkEmails({
      recipients: subscribers.map(email => ({ email })),
      subject: `New Trading Signal: ${signal.title}`,
      template: 'signal-alert',
      globalData: {
        signalTitle: signal.title,
        signalDescription: signal.description,
        platform: signal.platform,
        strategy: signal.strategy,
        downloadUrl: `${process.env.SITE_URL || 'https://forexeahub.com'}/download/${signal.uuid}`,
        isPremium: signal.isPremium,
        price: signal.price,
        unsubscribeUrl: `${process.env.SITE_URL || 'https://forexeahub.com'}/unsubscribe`
      }
    });
  }

  /**
   * Get email queue statistics
   */
  async getQueueStats(): Promise<any> {
    if (!this.emailQueue) {
      return { error: 'Email queue not available' };
    }

    const [
      waitingCount,
      activeCount,
      completedCount,
      failedCount,
      delayedCount
    ] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount()
    ]);

    return {
      waiting: waitingCount,
      active: activeCount,
      completed: completedCount,
      failed: failedCount,
      delayed: delayedCount
    };
  }

  /**
   * Clear completed jobs from queue
   */
  async clearCompletedJobs(): Promise<void> {
    if (!this.emailQueue) return;
    
    const jobs = await this.emailQueue.getCompleted();
    await Promise.all(jobs.map(job => job.remove()));
    console.log(`Cleared ${jobs.length} completed email jobs`);
  }

  /**
   * Retry failed jobs
   */
  async retryFailedJobs(): Promise<void> {
    if (!this.emailQueue) return;
    
    const jobs = await this.emailQueue.getFailed();
    await Promise.all(jobs.map(job => job.retry()));
    console.log(`Retrying ${jobs.length} failed email jobs`);
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types
export type { EmailOptions, BulkEmailOptions };