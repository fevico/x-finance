import * as fs from 'fs';
import * as path from 'path';

import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail({
    to,
    subject,
    html,
    from = process.env.DEFAULT_EMAIL_FROM,
  }: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }) {
    return this.resend.emails.send({
      from: from || process.env.DEFAULT_EMAIL_FROM || '',
      to,
      subject,
      html,
    });
  }

  /**
   * Helper to wrap email content in the base template.
   * @param contentHtml The main HTML content for the email (already rendered)
   * @param subject The subject/title for the email
   * @param variables Extra variables (e.g. year)
   */
  wrapWithBaseTemplate(
    contentHtml: string,
    subject: string,
    variables: Record<string, string | number> = {},
  ): string {
    let base = fs.readFileSync(
      path.resolve(process.cwd(), 'src/email/templates/base-template.html'),
      'utf8',
    );
    base = base.replace(/{{subject}}/g, subject);
    base = base.replace(/{{content}}/g, contentHtml);
    for (const [key, value] of Object.entries(variables)) {
      base = base.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return base;
  }
  /**
   * Render a template file with variables (for content blocks)
   */
  renderHtmlTemplate(
    templatePath: string,
    variables: Record<string, string | number>,
  ): string {
    let html = fs.readFileSync(path.resolve(templatePath), 'utf8');
    for (const [key, value] of Object.entries(variables)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return html;
  }
}
