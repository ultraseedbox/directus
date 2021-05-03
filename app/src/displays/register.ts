import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import registerComponent from '@/utils/register-component/';
import asyncPool from 'tiny-async-pool';
import { Component } from 'vue';
import { getDisplays } from './index';
import { DisplayConfig } from './types';

const { displaysRaw } = getDisplays();

export async function registerDisplays(): Promise<void> {
	const context = require.context('.', true, /^.*index\.ts$/);

	const modules = context
		.keys()
		.map((key) => context(key))
		.map((mod) => mod.default)
		.filter((m) => m);

	try {
		const customResponse = await api.get('/extensions/displays/');
		const displays: string[] = customResponse.data.data || [];

		await asyncPool(5, displays, async (displayName) => {
			try {
				const result = await import(
					/* webpackIgnore: true */ getRootPath() + `extensions/displays/${displayName}/index.js`
				);
				modules.push(result.default);
			} catch (err) {
				console.warn(`Couldn't load custom displays "${displayName}":`, err);
			}
		});
	} catch {
		console.warn(`Couldn't load custom displays`);
	}

	displaysRaw.value = modules;

	displaysRaw.value.forEach((display: DisplayConfig) => {
		if (typeof display.handler !== 'function') {
			registerComponent('display-' + display.id, display.handler as Component);
		}

		if (typeof display.options !== 'function') {
			registerComponent('display-options-' + display.id, display.options as Component);
		}
	});
}
