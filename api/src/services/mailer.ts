import nodemailer, { Transporter } from 'nodemailer';
import env from '../env';
import logger from '../logger';

let transporter: Transporter | null = null;

if (env.EMAIL_TRANSPORT === 'sendmail') {
	transporter = nodemailer.createTransport({
		sendmail: true,
		newline: env.EMAIL_SENDMAIL_NEW_LINE || 'unix',
		path: env.EMAIL_SENDMAIL_PATH || '/usr/sbin/sendmail',
	});
} else if (env.EMAIL_TRANSPORT.toLowerCase() === 'smtp') {
	let auth: boolean | { user?: string; pass?: string } = false;

	if (env.EMAIL_SMTP_USER || env.EMAIL_SMTP_PASSWORD) {
		auth = {
			user: env.EMAIL_SMTP_USER,
			pass: env.EMAIL_SMTP_PASSWORD,
		};
	}

	transporter = nodemailer.createTransport({
		pool: env.EMAIL_SMTP_POOL,
		host: env.EMAIL_SMTP_HOST,
		port: env.EMAIL_SMTP_PORT,
		secure: env.EMAIL_SMTP_SECURE,
		auth: auth,
	} as Record<string, unknown>);
} else if (env.EMAIL_TRANSPORT.toLowerCase() === 'mailgun') {
	const mg = require('nodemailer-mailgun-transport');
	transporter = nodemailer.createTransport(
		mg({
			auth: {
				api_key: env.EMAIL_MAILGUN_API_KEY,
				domain: env.EMAIL_MAILGUN_DOMAIN,
			},
		}) as any
	);
} else {
	logger.warn('Illegal transport given for email. Check the EMAIL_TRANSPORT env var.');
}

if (transporter) {
	transporter.verify((error) => {
		if (error) {
			logger.warn(`Couldn't connect to email server.`);
			logger.warn(`Email verification error: ${error}`);
		} else {
			logger.info(`Email connection established`);
		}
	});
}

export default transporter;
