import express, { Router } from 'express';
import { ensureDir } from 'fs-extra';
import path from 'path';
import database from './database';
import emitter from './emitter';
import env from './env';
import * as exceptions from './exceptions';
import { ServiceUnavailableException } from './exceptions';
import logger from './logger';
import * as services from './services';
import { EndpointRegisterFunction, HookRegisterFunction } from './types';
import { getSchema } from './utils/get-schema';
import listFolders from './utils/list-folders';

export async function ensureFoldersExist(): Promise<void> {
	const folders = ['endpoints', 'hooks', 'interfaces', 'modules', 'layouts', 'displays'];

	for (const folder of folders) {
		const folderPath = path.resolve(env.EXTENSIONS_PATH, folder);
		try {
			await ensureDir(folderPath);
		} catch (err) {
			logger.warn(err);
		}
	}
}

export async function initializeExtensions(): Promise<void> {
	await ensureFoldersExist();
}

export async function listExtensions(type: string): Promise<string[]> {
	const extensionsPath = env.EXTENSIONS_PATH as string;
	const location = path.join(extensionsPath, type);

	try {
		return await listFolders(location);
	} catch (err) {
		if (err.code === 'ENOENT') {
			throw new ServiceUnavailableException(`Extension folder "extensions/${type}" couldn't be opened`, {
				service: 'extensions',
			});
		}
		throw err;
	}
}

export async function registerExtensions(router: Router): Promise<void> {
	await registerExtensionHooks();
	await registerExtensionEndpoints(router);
}

export async function registerExtensionEndpoints(router: Router): Promise<void> {
	let endpoints: string[] = [];
	try {
		endpoints = await listExtensions('endpoints');
		registerEndpoints(endpoints, router);
	} catch (err) {
		logger.warn(err);
	}
}

export async function registerExtensionHooks(): Promise<void> {
	let hooks: string[] = [];
	try {
		hooks = await listExtensions('hooks');
		registerHooks(hooks);
	} catch (err) {
		logger.warn(err);
	}
}

function registerHooks(hooks: string[]) {
	const extensionsPath = env.EXTENSIONS_PATH as string;

	for (const hook of hooks) {
		try {
			registerHook(hook);
		} catch (error) {
			logger.warn(`Couldn't register hook "${hook}"`);
			logger.warn(error);
		}
	}

	function registerHook(hook: string) {
		const hookPath = path.resolve(extensionsPath, 'hooks', hook, 'index.js');
		const hookInstance: HookRegisterFunction | { default?: HookRegisterFunction } = require(hookPath);

		let register: HookRegisterFunction = hookInstance as HookRegisterFunction;
		if (typeof hookInstance !== 'function') {
			if (hookInstance.default) {
				register = hookInstance.default;
			}
		}

		const events = register({ services, exceptions, env, database, getSchema });
		for (const [event, handler] of Object.entries(events)) {
			emitter.on(event, handler);
		}
	}
}

function registerEndpoints(endpoints: string[], router: Router) {
	const extensionsPath = env.EXTENSIONS_PATH as string;

	for (const endpoint of endpoints) {
		try {
			registerEndpoint(endpoint);
		} catch (error) {
			logger.warn(`Couldn't register endpoint "${endpoint}"`);
			logger.warn(error);
		}
	}

	function registerEndpoint(endpoint: string) {
		const endpointPath = path.resolve(extensionsPath, 'endpoints', endpoint, 'index.js');
		const endpointInstance: EndpointRegisterFunction | { default?: EndpointRegisterFunction } = require(endpointPath);

		let register: EndpointRegisterFunction = endpointInstance as EndpointRegisterFunction;
		if (typeof endpointInstance !== 'function') {
			if (endpointInstance.default) {
				register = endpointInstance.default;
			}
		}

		const scopedRouter = express.Router();
		router.use(`/${endpoint}/`, scopedRouter);

		register(scopedRouter, { services, exceptions, env, database, getSchema });
	}
}
