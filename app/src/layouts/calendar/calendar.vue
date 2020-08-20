<template>
	<div class="calendar">
		<portal to="layout-options">
			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.calendar.datetime') }}</div>
				<v-select
					v-model="datetime"
					show-deselect
					item-value="field"
					item-text="name"
					:items="availableFields"
				/>
			</div>

			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.calendar.date') }}</div>
				<v-select v-model="date" show-deselect item-value="field" item-text="name" :items="availableFields" />
			</div>

			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.calendar.time') }}</div>
				<v-select v-model="time" show-deselect item-value="field" item-text="name" :items="availableFields" />
			</div>

			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.calendar.title') }}</div>
				<v-select v-model="title" show-deselect item-value="field" item-text="name" :items="availableFields" />
			</div>

			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.calendar.color') }}</div>
				<v-select v-model="color" show-deselect item-value="field" item-text="name" :items="availableFields" />
			</div>
		</portal>
		<div v-for="item in items" :key="item.title">{{ item.title }}</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, inject, computed, ref } from '@vue/composition-api';
import { Filter } from '@/types';
import useSync from '@/composables/use-sync/';
import useCollection from '@/composables/use-collection/';
import useItems from '@/composables/use-items';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import { useRelationsStore } from '@/stores/';

import i18n from '@/lang';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import useElementSize from '@/composables/use-element-size';
import { clone } from 'lodash';

type Item = Record<string, any>;

type ViewOptions = {
	datetime?: string;
	date?: string;
	time?: string;
	title?: string;
	color?: string;
};

type ViewQuery = {
	fields?: string[];
	sort?: string;
	limit?: number;
};

export default defineComponent({
	components: {},
	props: {
		collection: {
			type: String,
			required: true,
		},
		selection: {
			type: Array as PropType<Item[]>,
			default: undefined,
		},
		viewOptions: {
			type: Object as PropType<ViewOptions>,
			default: null,
		},
		viewQuery: {
			type: Object as PropType<ViewQuery>,
			default: null,
		},
		filters: {
			type: Array as PropType<Filter[]>,
			default: () => [],
		},
		selectMode: {
			type: Boolean,
			default: false,
		},
		file: {
			type: Object as PropType<File>,
			default: null,
		},
		searchQuery: {
			type: String as PropType<string | null>,
			default: null,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();

		const layoutElement = ref<HTMLElement | null>(null);
		const mainElement = inject('main-element', ref<Element | null>(null));

		const _selection = useSync(props, 'selection', emit);
		const _viewOptions = useSync(props, 'viewOptions', emit);
		const _viewQuery = useSync(props, 'viewQuery', emit);
		const _filters = useSync(props, 'filters', emit);
		const _searchQuery = useSync(props, 'searchQuery', emit);

		const { collection, searchQuery } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const availableFields = computed(() => fieldsInCollection.value.filter((field) => field.meta.hidden !== true));

		const datetimeFields = computed(() => {
			return availableFields.value.filter((field) => {
				if (field.field === '$file') return true;

				const relation = relationsStore.state.relations.find((relation) => {
					return (
						relation.many_collection === props.collection &&
						relation.many_field === field.field &&
						relation.one_collection === 'directus_files'
					);
				});

				return !!relation;
			});
		});

		const { date, time, datetime, title, color } = useViewOptions();
		const { sort, limit, page, fields } = useViewQuery();

		const { items, loading, error, totalPages, itemCount, getItems } = useItems(collection, {
			sort,
			limit,
			page: null,
			fields: fields,
			filters: _filters,
			searchQuery,
		});

		return {
			_selection,
			items,
			loading,
			error,
			totalPages,
			page,
			itemCount,
			availableFields,
			limit,
			primaryKeyField,
			datetimeFields,
			title,
			color,
			datetime,
			date,
			time,
			sort,
			fieldsInCollection,
			_filters,
			info,
			layoutElement,
		};

		function useViewOptions() {
			const datetime = createViewOption<string>('datetime', null);
			const date = createViewOption<string>('date', null);
			const time = createViewOption<string>('time', null);
			const title = createViewOption<string>('title', null);
			const color = createViewOption<string>('color', null);

			return { datetime, date, time, title, color };

			function createViewOption<T>(key: keyof ViewOptions, defaultValue: any) {
				return computed<T>({
					get() {
						return _viewOptions.value?.[key] !== undefined ? _viewOptions.value?.[key] : defaultValue;
					},
					set(newValue: T) {
						_viewOptions.value = {
							..._viewOptions.value,
							[key]: newValue,
						};
					},
				});
			}
		}

		function useViewQuery() {
			const date = ref(new Date(Date.now()));

			const sort = createViewQueryOption<string>('sort', availableFields.value[0].field);
			const limit = createViewQueryOption<number>('limit', 500);

			const fields = computed<string[]>(() => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const fields = [primaryKeyField.value!.field];

				if (imageSource.value) {
					fields.push(`${imageSource.value}.type`);
					fields.push(`${imageSource.value}.filename_disk`);
					fields.push(`${imageSource.value}.storage`);
					fields.push(`${imageSource.value}.id`);
				}

				if (props.collection === 'directus_files' && imageSource.value === '$file') {
					fields.push('type');
				}

				const sortField = sort.value.startsWith('-') ? sort.value.substring(1) : sort.value;

				if (fields.includes(sortField) === false) {
					fields.push(sortField);
				}

				const titleSubtitleFields: string[] = [];

				if (title.value) {
					titleSubtitleFields.push(...getFieldsFromTemplate(title.value));
				}

				if (subtitle.value) {
					titleSubtitleFields.push(...getFieldsFromTemplate(subtitle.value));
				}

				return [...fields, ...adjustFieldsForDisplays(titleSubtitleFields, props.collection)];
			});

			return { sort, limit, page, fields };

			function createViewQueryOption<T>(key: keyof ViewQuery, defaultValue: any) {
				return computed<T>({
					get() {
						return _viewQuery.value?.[key] || defaultValue;
					},
					set(newValue: T) {
						page.value = 1;
						_viewQuery.value = {
							..._viewQuery.value,
							[key]: newValue,
						};
					},
				});
			}
		}
	},
});
</script>
