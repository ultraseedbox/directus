import BaseJoi, { AnySchema } from 'joi';
import { escapeRegExp, merge } from 'lodash';
import { FieldFilter } from '../types/filter';

const Joi = BaseJoi.extend({
	type: 'string',
	base: BaseJoi.string(),
	messages: {
		'string.contains': '{{#label}} must contain [{{#substring}}]',
		'string.ncontains': "{{#label}} can't contain [{{#substring}}]",
	},
	rules: {
		contains: {
			args: [
				{
					name: 'substring',
					ref: true,
					assert: (val) => typeof val === 'string',
					message: 'must be a string',
				},
			],
			method(substring) {
				return this.$_addRule({ name: 'contains', args: { substring } });
			},
			validate(value, helpers, { substring }) {
				if (value.includes(substring) === false) {
					return helpers.error('string.contains', { substring });
				}

				return value;
			},
		},
		ncontains: {
			args: [
				{
					name: 'substring',
					ref: true,
					assert: (val) => typeof val === 'string',
					message: 'must be a string',
				},
			],
			method(substring) {
				return this.$_addRule({ name: 'ncontains', args: { substring } });
			},
			validate(value, helpers, { substring }) {
				if (value.includes(substring) === true) {
					return helpers.error('string.ncontains', { substring });
				}

				return value;
			},
		},
	},
});

export type JoiOptions = {
	requireAll?: boolean;
};

const defaults: JoiOptions = {
	requireAll: false,
};

/**
 * Generate a Joi schema from a filter object.
 *
 * @param {FieldFilter} filter - Field filter object. Note: does not support _and/_or filters.
 * @param {JoiOptions} [options] - Options for the schema generation.
 * @returns {AnySchema} Joi schema.
 */
export function generateJoi(filter: FieldFilter, options?: JoiOptions): AnySchema {
	filter = filter || {};

	options = merge({}, defaults, options);

	const schema: Record<string, AnySchema> = {};

	const key = Object.keys(filter)[0];

	if (!key) {
		throw new Error(`[generateJoi] Filter doesn't contain field key. Passed filter: ${JSON.stringify(filter)}`);
	}

	const value = Object.values(filter)[0];

	if (!value) {
		throw new Error(`[generateJoi] Filter doesn't contain filter rule. Passed filter: ${JSON.stringify(filter)}`);
	}

	const isField = key.startsWith('_') === false;

	if (isField) {
		const operator = Object.keys(value)[0];

		if (operator === '_eq') {
			schema[key] = Joi.any().equal(Object.values(value)[0]);
		}

		if (operator === '_neq') {
			schema[key] = Joi.any().not(Object.values(value)[0]);
		}

		if (operator === '_contains') {
			schema[key] = Joi.string().contains(Object.values(value)[0]);
		}

		if (operator === '_ncontains') {
			schema[key] = Joi.string().ncontains(Object.values(value)[0]);
		}

		if (operator === '_starts_with') {
			schema[key] = Joi.string().pattern(new RegExp(`^${escapeRegExp(Object.values(value)[0] as string)}.*`), {
				name: 'starts_with',
			});
		}

		if (operator === '_nstarts_with') {
			schema[key] = Joi.string().pattern(new RegExp(`^${escapeRegExp(Object.values(value)[0] as string)}.*`), {
				name: 'starts_with',
				invert: true,
			});
		}

		if (operator === '_ends_with') {
			schema[key] = Joi.string().pattern(new RegExp(`.*${escapeRegExp(Object.values(value)[0] as string)}$`), {
				name: 'ends_with',
			});
		}

		if (operator === '_nends_with') {
			schema[key] = Joi.string().pattern(new RegExp(`.*${escapeRegExp(Object.values(value)[0] as string)}$`), {
				name: 'ends_with',
				invert: true,
			});
		}

		if (operator === '_in') {
			schema[key] = Joi.any().equal(...(Object.values(value)[0] as (string | number)[]));
		}

		if (operator === '_nin') {
			schema[key] = Joi.any().not(...(Object.values(value)[0] as (string | number)[]));
		}

		if (operator === '_gt') {
			schema[key] = Joi.number().greater(Number(Object.values(value)[0]));
		}

		if (operator === '_gte') {
			schema[key] = Joi.number().min(Number(Object.values(value)[0]));
		}

		if (operator === '_lt') {
			schema[key] = Joi.number().less(Number(Object.values(value)[0]));
		}

		if (operator === '_lte') {
			schema[key] = Joi.number().max(Number(Object.values(value)[0]));
		}

		if (operator === '_null') {
			schema[key] = Joi.any().valid(null);
		}

		if (operator === '_nnull') {
			schema[key] = Joi.any().invalid(null);
		}

		if (operator === '_empty') {
			schema[key] = Joi.any().valid('');
		}

		if (operator === '_nempty') {
			schema[key] = Joi.any().invalid('');
		}

		if (operator === '_between') {
			const values = Object.values(value)[0] as number[];
			schema[key] = Joi.number().greater(values[0]).less(values[1]);
		}

		if (operator === '_nbetween') {
			const values = Object.values(value)[0] as number[];
			schema[key] = Joi.number().less(values[0]).greater(values[1]);
		}
	} else {
		schema[key] = Joi.object({
			[key]: generateJoi(value as FieldFilter, options),
		});
	}

	schema[key] = schema[key] ?? Joi.any();

	if (options.requireAll) {
		schema[key] = schema[key]!.required();
	}

	return Joi.object(schema).unknown();
}
