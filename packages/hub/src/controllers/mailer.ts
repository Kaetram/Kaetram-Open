import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import { createTransport } from 'nodemailer';

import type { Transporter } from 'nodemailer';

export default class Mailer {
    // Create the transporter if a SMTP user is provided.
    private transporter: Transporter | undefined = config.smtpUser
        ? createTransport({
              host: config.smtpHost,
              port: config.smtpPort,
              secure: config.smtpUseSecure,
              auth: {
                  user: config.smtpUser,
                  pass: config.smtpPassword
              }
          })
        : undefined;

    /**
     * Handles sending an email using the nodemailer library.
     * @param to Who we are sending the email to.
     * @param subject The subject of the email.
     * @param text The text contents of the email.
     */

    public send(to: string, subject: string, text: string): void {
        // We didn't initialize the transporter, so we can't send emails.
        if (!this.transporter) return;

        try {
            this.transporter.sendMail({
                from: config.smtpUser,
                to,
                subject,
                text
            });
        } catch {
            log.error(`Failed to send email to ${to}!`);
        }
    }
}
