import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

const GMAIL_FROM = 'ReservAr <reservar.app.ok@gmail.com>';

@Injectable()
export class NotificationsService {
  private resend: Resend | null = null;
  private gmailTransporter: Transporter | null = null;

  constructor(private prisma: PrismaService) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      this.resend = new Resend(resendKey);
    }

    const gmailUser = process.env.GMAIL_USER || process.env.GMAIL_EMAIL;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    if (gmailUser && gmailPass) {
      this.gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });
      console.log('📧 Gmail configurado para envío de confirmaciones y recordatorios:', gmailUser);
    } else {
      console.warn('⚠️ GMAIL_USER y GMAIL_APP_PASSWORD no configurados. Para enviar desde tu casilla, configuralos en .env');
    }
  }

  /** Indica si debemos usar Gmail para reservas (confirmación, recordatorio, cancelación) */
  private useGmail(): boolean {
    return this.gmailTransporter !== null;
  }

  async sendMagicLink(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const magicLink = `${frontendUrl}/auth/callback?token=${token}`;
    if (!this.resend && !this.gmailTransporter) {
      console.log('📧 Magic Link (email no configurado):', magicLink);
      return { success: true, message: 'Magic link generado (email no configurado)', magicLink };
    }
    try {
      if (this.gmailTransporter) {
        await this.gmailTransporter.sendMail({
          from: GMAIL_FROM,
          to: email,
          subject: 'Iniciar sesión en ReservAr',
          html: this.getMagicLinkTemplate(magicLink),
        });
      } else if (this.resend) {
        await this.resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'ReservAr <onboarding@resend.dev>',
          to: email,
          replyTo: 'reservar.app.ok@gmail.com',
          subject: 'Iniciar sesión en ReservAr',
          html: this.getMagicLinkTemplate(magicLink),
        });
      }
      return { success: true, message: 'Magic link enviado por email' };
    } catch (error) {
      console.error('❌ Error sending magic link email:', error);
      throw error;
    }
  }

  async sendAppointmentConfirmation(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
        professional: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: appointment.tenantId },
    });

    const startDate = new Date(appointment.startTime);
    const endDate = new Date(appointment.endTime);

    const locationLabel = appointment.professional?.fullName || appointment.service.name;
    const icsContent = this.generateICS(
      appointment.service.name,
      locationLabel,
      startDate,
      endDate,
      tenant?.name || 'ReservAr',
    );

    const subject = `Confirmación de reserva - ${appointment.service.name}`;
    const html = this.getAppointmentConfirmationTemplate(
      appointment,
      tenant,
      startDate,
      endDate,
    );
    const to = appointment.customer.email;
    const icsFilename = `reserva-${startDate.toISOString().split('T')[0]}.ics`;

    if (!this.useGmail() && (!this.resend || process.env.NODE_ENV === 'development')) {
      console.log('📧 Email de confirmación (sin envío):', { to, subject });
      return { success: true, message: 'Email de confirmación generado (modo desarrollo)' };
    }

    try {
      if (this.useGmail() && this.gmailTransporter) {
        console.log('📧 Enviando confirmación por Gmail a:', to);
        await this.gmailTransporter.sendMail({
          from: GMAIL_FROM,
          to,
          replyTo: 'reservar.app.ok@gmail.com',
          subject,
          html,
          attachments: [{ filename: icsFilename, content: icsContent }],
        });
        console.log('✅ Email de confirmación enviado a', to);
      } else if (this.resend) {
        await this.resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'ReservAr <onboarding@resend.dev>',
          replyTo: 'reservar.app.ok@gmail.com',
          to,
          subject,
          html,
          attachments: [
            { filename: icsFilename, content: Buffer.from(icsContent).toString('base64') },
          ],
        });
      }

      return { success: true, message: 'Email de confirmación enviado' };
    } catch (error: any) {
      console.error('❌ Error enviando email de confirmación:', error?.message || error);
      if (error?.response) console.error('Gmail response:', error.response);
      throw error;
    }
  }

  async sendAppointmentReminder(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
        professional: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: appointment.tenantId },
    });

    const startDate = new Date(appointment.startTime);

    const subject = `Recordatorio: Tu reserva es mañana - ${appointment.service.name}`;
    const html = this.getReminderTemplate(appointment, tenant, startDate);
    const to = appointment.customer.email;

    if (!this.useGmail() && (!this.resend || process.env.NODE_ENV === 'development')) {
      console.log('📧 Recordatorio (sin envío):', { to, subject });
      return { success: true, message: 'Recordatorio generado (modo desarrollo)' };
    }

    try {
      if (this.useGmail() && this.gmailTransporter) {
        await this.gmailTransporter.sendMail({
          from: GMAIL_FROM,
          to,
          replyTo: 'reservar.app.ok@gmail.com',
          subject,
          html,
        });
      } else if (this.resend) {
        await this.resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'ReservAr <onboarding@resend.dev>',
          replyTo: 'reservar.app.ok@gmail.com',
          to,
          subject,
          html,
        });
      }
      return { success: true, message: 'Recordatorio enviado' };
    } catch (error) {
      console.error('Error sending reminder email:', error);
      throw error;
    }
  }

  async sendAppointmentCancellation(appointmentId: string, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
        professional: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: appointment.tenantId },
    });

    const subject = `Reserva cancelada - ${appointment.service.name}`;
    const html = this.getCancellationTemplate(appointment, tenant, reason);
    const to = appointment.customer.email;

    if (!this.useGmail() && (!this.resend || process.env.NODE_ENV === 'development')) {
      console.log('📧 Cancelación (sin envío):', { to, subject });
      return { success: true, message: 'Email de cancelación generado (modo desarrollo)' };
    }

    try {
      if (this.useGmail() && this.gmailTransporter) {
        await this.gmailTransporter.sendMail({
          from: GMAIL_FROM,
          to,
          replyTo: 'reservar.app.ok@gmail.com',
          subject,
          html,
        });
      } else if (this.resend) {
        await this.resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'ReservAr <onboarding@resend.dev>',
          replyTo: 'reservar.app.ok@gmail.com',
          to,
          subject,
          html,
        });
      }
      return { success: true, message: 'Email de cancelación enviado' };
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      throw error;
    }
  }

  // Templates de emails
  private getMagicLinkTemplate(magicLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Iniciar Sesión</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Haz click en el siguiente botón para iniciar sesión:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Iniciar Sesión
              </a>
            </div>
            <p style="font-size: 12px; color: #666;">O copia y pega este link en tu navegador:</p>
            <p style="font-size: 12px; color: #666; word-break: break-all;">${magicLink}</p>
            <p style="font-size: 12px; color: #666; margin-top: 30px;">Este link expira en 15 minutos.</p>
          </div>
        </body>
      </html>
    `;
  }

  private getAppointmentConfirmationTemplate(
    appointment: any,
    tenant: any,
    startDate: Date,
    endDate: Date,
  ): string {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✅ Turno Confirmado</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hola <strong>${appointment.customer.firstName} ${appointment.customer.lastName}</strong>,</p>
            <p>Tu turno ha sido confirmado exitosamente.</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h2 style="margin-top: 0; color: #667eea;">Detalles de la reserva</h2>
              <p><strong>Espacio:</strong> ${appointment.service.name}</p>
              ${appointment.professional ? `<p><strong>Recurso:</strong> ${appointment.professional.fullName}</p>` : ''}
              <p><strong>Fecha:</strong> ${formatDate(startDate)}</p>
              <p><strong>Hora:</strong> ${formatTime(startDate)} - ${formatTime(endDate)}</p>
              ${tenant?.phone ? `<p><strong>Teléfono:</strong> ${tenant.phone}</p>` : ''}
              ${tenant?.email ? `<p><strong>Email:</strong> ${tenant.email}</p>` : ''}
            </div>

            <p>Hemos adjuntado un archivo .ics que puedes agregar a tu calendario (Google Calendar, Outlook, Apple Calendar).</p>
            
            <p style="font-size: 12px; color: #666; margin-top: 30px;">
              <strong>Nota:</strong> Te enviaremos un recordatorio 24 horas antes de tu cita.
              Si necesitas cancelar o reprogramar, por favor contáctanos con al menos 12 horas de anticipación.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private getReminderTemplate(appointment: any, tenant: any, startDate: Date): string {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">⏰ Recordatorio de Turno</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hola <strong>${appointment.customer.firstName} ${appointment.customer.lastName}</strong>,</p>
            <p>Te recordamos que tienes un turno programado para mañana:</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f5576c;">
              <h2 style="margin-top: 0; color: #f5576c;">Detalles de la reserva</h2>
              <p><strong>Espacio:</strong> ${appointment.service.name}</p>
              ${appointment.professional ? `<p><strong>Recurso:</strong> ${appointment.professional.fullName}</p>` : ''}
              <p><strong>Fecha:</strong> ${formatDate(startDate)}</p>
              <p><strong>Hora:</strong> ${formatTime(startDate)}</p>
            </div>

            <p>¡Te esperamos!</p>
            ${tenant?.phone ? `<p>Si necesitas cancelar o reprogramar, contáctanos al: <strong>${tenant.phone}</strong></p>` : ''}
          </div>
        </body>
      </html>
    `;
  }

  private getCancellationTemplate(appointment: any, tenant: any, reason?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">❌ Turno Cancelado</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hola <strong>${appointment.customer.firstName} ${appointment.customer.lastName}</strong>,</p>
            <p>Lamentamos informarte que tu turno ha sido cancelado.</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #fa709a;">
              <h2 style="margin-top: 0; color: #fa709a;">Reserva cancelada</h2>
              <p><strong>Espacio:</strong> ${appointment.service.name}</p>
              ${appointment.professional ? `<p><strong>Recurso:</strong> ${appointment.professional.fullName}</p>` : ''}
              ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
            </div>

            <p>Si tienes alguna consulta o deseas reprogramar, por favor contáctanos.</p>
            ${tenant?.phone ? `<p>Teléfono: <strong>${tenant.phone}</strong></p>` : ''}
            ${tenant?.email ? `<p>Email: <strong>${tenant.email}</strong></p>` : ''}
          </div>
        </body>
      </html>
    `;
  }

  // Generar archivo .ics para calendarios
  private generateICS(
    serviceName: string,
    professionalName: string,
    startDate: Date,
    endDate: Date,
    location: string,
  ): string {
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Turnero//Turnero//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${serviceName} - ${professionalName}`,
      `DESCRIPTION:Turno con ${professionalName} para ${serviceName}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Recordatorio de turno',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }
}

