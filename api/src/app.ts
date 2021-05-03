import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import expressLogger from 'express-pino-logger';
import fse from 'fs-extra';
import path from 'path';
import qs from 'qs';
import activityRouter from './controllers/activity';
import assetsRouter from './controllers/assets';
import authRouter from './controllers/auth';
import collectionsRouter from './controllers/collections';
import extensionsRouter from './controllers/extensions';
import fieldsRouter from './controllers/fields';
import filesRouter from './controllers/files';
import foldersRouter from './controllers/folders';
import graphqlRouter from './controllers/graphql';
import itemsRouter from './controllers/items';
import notFoundHandler from './controllers/not-found';
import permissionsRouter from './controllers/permissions';
import presetsRouter from './controllers/presets';
import relationsRouter from './controllers/relations';
import revisionsRouter from './controllers/revisions';
import rolesRouter from './controllers/roles';
import serverRouter from './controllers/server';
import settingsRouter from './controllers/settings';
import usersRouter from './controllers/users';
import utilsRouter from './controllers/utils';
import webhooksRouter from './controllers/webhooks';
import { isInstalled, validateDBConnection } from './database';
import { emitAsyncSafe } from './emitter';
import env from './env';
import { InvalidPayloadException } from './exceptions';
import { initializeExtensions, registerExtensionEndpoints, registerExtensionHooks } from './extensions';
import logger from './logger';
import authenticate from './middleware/authenticate';
import cache from './middleware/cache';
import { checkIP } from './middleware/check-ip';
import cors from './middleware/cors';
import errorHandler from './middleware/error-handler';
import extractToken from './middleware/extract-token';
import rateLimiter from './middleware/rate-limiter';
import sanitizeQuery from './middleware/sanitize-query';
import schema from './middleware/schema';
import { track } from './utils/track';
import { validateEnv } from './utils/validate-env';
import { register as registerWebhooks } from './webhooks';
import { session } from './middleware/session';

export default async function createApp(): Promise<express.Application> {
	validateEnv(['KEY', 'SECRET']);

	await validateDBConnection();

	if ((await isInstalled()) === false) {
		logger.error(`Database doesn't have Directus tables installed.`);
		process.exit(1);
	}

	await initializeExtensions();

	await registerExtensionHooks();

	const app = express();

	const customRouter = express.Router();

	app.disable('x-powered-by');
	app.set('trust proxy', true);
	app.set('query parser', (str: string) => qs.parse(str, { depth: 10 }));

	await emitAsyncSafe('init.before', { app });

	await emitAsyncSafe('middlewares.init.before', { app });

	app.use(expressLogger({ logger }));

	app.use((req, res, next) => {
		bodyParser.json({
			limit: env.MAX_PAYLOAD_SIZE,
		})(req, res, (err) => {
			if (err) {
				return next(new InvalidPayloadException(err.message));
			}

			return next();
		});
	});

	app.use(cookieParser());

	app.use(extractToken);

	app.use((req, res, next) => {
		res.setHeader('X-Powered-By', 'Directus');
		next();
	});

	if (env.CORS_ENABLED === true) {
		app.use(cors);
	}

	if (!('DIRECTUS_DEV' in process.env)) {
		const adminPath = require.resolve('@directus/app/dist/index.html');
		const publicUrl = env.PUBLIC_URL.endsWith('/') ? env.PUBLIC_URL : env.PUBLIC_URL + '/';

		// Prefix all href/src in the index html with the APIs public path
		let html = fse.readFileSync(adminPath, 'utf-8');
		html = html.replace(/href="\//g, `href="${publicUrl}`);
		html = html.replace(/src="\//g, `src="${publicUrl}`);

		app.get('/', (req, res, next) => {
			if (env.ROOT_REDIRECT) {
				res.redirect(env.ROOT_REDIRECT);
			} else {
				next();
			}
		});

		app.get('/admin', (req, res) => res.send(html));
		app.use('/admin', express.static(path.join(adminPath, '..')));
		app.use('/admin/*', (req, res) => {
			res.send(html);
		});
	}

	// use the rate limiter - all routes for now
	if (env.RATE_LIMITER_ENABLED === true) {
		app.use(rateLimiter);
	}

	// We only rely on cookie-sessions in the oAuth flow where it's required
	app.use(session);

	app.use(authenticate);

	app.use(checkIP);

	app.use(sanitizeQuery);

	await emitAsyncSafe('middlewares.init.after', { app });

	await emitAsyncSafe('routes.init.before', { app });

	app.use(cache);

	app.use(schema);

	app.use('/auth', authRouter);

	app.use('/graphql', graphqlRouter);

	app.use('/activity', activityRouter);
	app.use('/assets', assetsRouter);
	app.use('/collections', collectionsRouter);
	app.use('/extensions', extensionsRouter);
	app.use('/fields', fieldsRouter);
	app.use('/files', filesRouter);
	app.use('/folders', foldersRouter);
	app.use('/items', itemsRouter);
	app.use('/permissions', permissionsRouter);
	app.use('/presets', presetsRouter);
	app.use('/relations', relationsRouter);
	app.use('/revisions', revisionsRouter);
	app.use('/roles', rolesRouter);
	app.use('/server/', serverRouter);
	app.use('/settings', settingsRouter);
	app.use('/users', usersRouter);
	app.use('/utils', utilsRouter);
	app.use('/webhooks', webhooksRouter);
	app.use('/custom', customRouter);

	// Register custom hooks / endpoints
	await emitAsyncSafe('routes.custom.init.before', { app });
	await registerExtensionEndpoints(customRouter);
	await emitAsyncSafe('routes.custom.init.after', { app });

	app.use(notFoundHandler);
	app.use(errorHandler);

	await emitAsyncSafe('routes.init.after', { app });

	// Register all webhooks
	await registerWebhooks();

	track('serverStarted');

	emitAsyncSafe('init');

	return app;
}
