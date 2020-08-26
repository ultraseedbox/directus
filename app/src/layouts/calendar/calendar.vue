<template>
	<div class="calendar">
		<portal to="layout-options">
			<div class="layout-option">
				<v-tabs v-model="isDatetimeTabs">
					<v-tab style="padding: unset;">Date & Time</v-tab>
					<v-tab style="padding: unset;">Datetime</v-tab>
				</v-tabs>
			</div>

			<div class="layout-option" v-show="isDatetime">
				<div class="option-label">{{ $t('layouts.calendar.datetime') }}</div>
				<v-select
					v-model="datetime"
					show-deselect
					item-value="field"
					item-text="name"
					:items="getFieldsWithType(['dateTime'])"
				/>
			</div>

			<div class="layout-option" v-show="!isDatetime">
				<div class="option-label">{{ $t('layouts.calendar.date') }}</div>
				<v-select
					v-model="date"
					show-deselect
					item-value="field"
					item-text="name"
					:items="getFieldsWithType(['date'])"
				/>
			</div>

			<div class="layout-option" v-show="!isDatetime">
				<div class="option-label">{{ $t('layouts.calendar.time') }}</div>
				<v-select
					v-model="time"
					show-deselect
					item-value="field"
					item-text="name"
					:items="getFieldsWithType(['time'])"
				/>
			</div>

			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.calendar.title') }}</div>
				<v-select
					v-model="title"
					show-deselect
					item-value="field"
					item-text="name"
					:items="getFieldsWithType(['string'])"
				/>
			</div>

			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.calendar.color') }}</div>
				<v-select
					v-model="color"
					show-deselect
					item-value="field"
					item-text="name"
					:items="getFieldsWithType(['string'])"
				/>
			</div>
		</portal>
		<div class="header">
			<div class="header-start">
				<div>
					<v-icon name="arrow_back" @click.native="backwards"></v-icon>
					<v-icon name="arrow_forward" @click.native="forwards"></v-icon>
				</div>
				<div class="currentDate">
					{{ $t('months.' + monthNames[currentDate.getMonth()]) }} {{ currentDate.getFullYear() }}
				</div>
			</div>
			<div class="header-center"></div>
			<div class="header-end">
				<v-button @click="resetCurrentDate" small :disabled="interval.isInInterval(new Date())">
					{{ $t('layouts.calendar.today').toUpperCase() }}
				</v-button>
				<v-button class="dropdown" small>
					<v-select v-model="viewType" :items="viewSelection" inline></v-select>
				</v-button>
			</div>
		</div>
		<div class="view">
			<transition :name="swipeTo">
				<component
					:is="viewType"
					:key="currentDate.toString()"
					class="view-element"
					:interval="interval"
					:viewOptions="viewOptions"
					:items="itemsWithLink"
					:collection="collection"
				></component>
			</transition>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, inject, computed, ref, watch, onMounted } from '@vue/composition-api';
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
import { monthNames, isSameDay, isSameMonth, isSameWeek, Interval } from './time';
import Day from './components/day.vue';
import Week from './components/week.vue';
import Month from './components/month.vue';
import Agenda from './components/agenda.vue';

type Item = Record<string, any>;

export type ViewOptions = {
	isAgenda?: boolean;
	isDatetime: boolean;
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
	components: { Month, Week, Day, Agenda },
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
		onMounted(() => {
			updateFilters();
		});

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

		const { isAgenda, isDatetime, date, time, datetime, title, color } = useViewOptions();
		const { sort, limit, fields } = useViewQuery();

		const isDatetimeTabs = computed({
			get() {
				return [Number(isDatetime.value)];
			},
			set(newValue: number[]) {
				isDatetime.value = Boolean(newValue[0]);
			},
		});

		const { items, loading, error, totalPages, itemCount, getItems } = useItems(collection, {
			sort,
			limit,
			page: ref(0),
			fields: fields,
			filters: _filters,
			searchQuery,
		});

		const _currentDate = ref(new Date());
		const currentDate = computed({
			get() {
				return _currentDate.value;
			},
			set(newDate: Date) {
				_currentDate.value = newDate;
				updateFilters();
			},
		});
		const swipeTo = ref<'left' | 'right' | 'top' | 'bottom'>('left');
		const _viewType = ref<Interval.Type>(isAgenda ? Interval.Type.AGENDA : Interval.Type.MONTH);

		const viewType = computed({
			get() {
				return _viewType.value;
			},
			set(newVal: Interval.Type) {
				const typeToInt = { agenda: 0, month: 1, week: 2, day: 3 };

				swipeTo.value = typeToInt[newVal] < typeToInt[_viewType.value] ? 'top' : 'bottom';

				isAgenda.value = newVal == 'agenda';

				_viewType.value = newVal;
				updateFilters();
			},
		});

		const viewSelection = computed(() => {
			return [
				{ text: i18n.t('layouts.calendar.agenda'), value: 'agenda' },
				{ text: i18n.t('layouts.calendar.month'), value: 'month' },
				{ text: i18n.t('layouts.calendar.week'), value: 'week' },
				{ text: i18n.t('layouts.calendar.day'), value: 'day' },
			];
		});

		const interval = computed(() => new Interval(currentDate.value, viewType.value));
		const dateField = computed(() => (isDatetime.value ? datetime.value : date.value));

		const itemsWithLink = computed(() => {
			const itemRef: Record<string, any>[] = items.value;

			const itemList: Record<string, any>[] = [];
			itemRef.forEach((item) => {
				item['__link__'] = getLinkForItem(item);
				itemList.push(item);
			});
			return itemList;
		});

		return {
			_selection,
			itemsWithLink,
			loading,
			error,
			totalPages,
			itemCount,
			availableFields,
			limit,
			primaryKeyField,
			getFieldsWithType,
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
			isDatetimeTabs,
			isDatetime,
			swipeTo,
			viewType,
			currentDate,
			monthNames,
			forwards,
			backwards,
			resetCurrentDate,
			isSameDay,
			isSameMonth,
			interval,
			isAgenda,
			viewSelection,
		};

		function resetCurrentDate() {
			const now = new Date();
			const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			swipeTo.value = newDate < currentDate.value ? 'left' : 'right';
			currentDate.value = newDate;
		}

		function forwards() {
			swipeTo.value = 'right';
			let [month, day] = [currentDate.value.getMonth(), currentDate.value.getDate()];
			switch (viewType.value) {
				case 'agenda':
					month++;
					break;
				case 'month':
					month++;
					break;
				case 'week':
					day += 7;
					break;
				case 'day':
					day++;
					break;
				default:
					month++;
			}
			currentDate.value = new Date(currentDate.value.getFullYear(), month, day);
		}

		function backwards() {
			swipeTo.value = 'left';
			let [month, day] = [currentDate.value.getMonth(), currentDate.value.getDate()];
			switch (viewType.value) {
				case 'agenda':
					month--;
					break;
				case 'month':
					month--;
					break;
				case 'week':
					day -= 7;
					break;
				case 'day':
					day--;
					break;
				default:
					month--;
			}
			currentDate.value = new Date(currentDate.value.getFullYear(), month, day);
		}

		function getLinkForItem(item: Record<string, any>) {
			return `/collections/${props.collection}/${item[primaryKeyField.value!.field]}`;
		}

		function updateFilters() {
			if (dateField.value == null) return;

			const from = interval.value.getStart().toISOString();
			const to = interval.value.getEnd().toISOString();
			_filters.value = [
				{
					field: dateField.value,
					value: from + ',' + to,
					key: 'calendar-date',
					operator: 'between',
					locked: true,
				},
			];
		}

		function getFieldsWithType(types: string[]) {
			return availableFields.value.filter((field) => types.includes(field.type));
		}

		function useViewOptions() {
			const isAgenda = createViewOption<boolean>('isAgenda', false);
			const isDatetime = createViewOption<boolean>('isDatetime', true);
			const datetime = createViewOption<string>('datetime', null);
			const date = createViewOption<string>('date', null);
			const time = createViewOption<string>('time', null);
			const title = createViewOption<string>('title', null);
			const color = createViewOption<string>('color', null);

			return { datetime, date, time, title, color, isDatetime, isAgenda };

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

			const sortField = isDatetime.value ? datetime.value : date.value;
			const sort = createViewQueryOption<string>(
				'sort',
				'-' + availableFields.value.find((f) => f.field == sortField)?.field
			);

			const limit = createViewQueryOption<number>('limit', 500);

			const fields = createViewQueryOption<Array<string>>('fields', ['*']);

			return { sort, limit, fields };

			function createViewQueryOption<T>(key: keyof ViewQuery, defaultValue: any) {
				return computed<T>({
					get() {
						return _viewQuery.value?.[key] || defaultValue;
					},
					set(newValue: T) {
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

<style lang="scss" scoped>
.calendar {
	display: flex;
	flex-direction: column;
	height: calc(100% - var(--layout-offset-top) * 2);
	overflow: hidden;

	.header {
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
		padding: 0 20px;

		&-start {
			display: flex;
			align-items: center;
			font-size: 18px;

			.v-icon {
				cursor: pointer;
			}

			.currentDate {
				width: 150px;
				margin-left: 10px;
			}
		}

		&-end {
			display: flex;

			.dropdown {
				margin-left: 20px;
			}
		}
	}

	.view {
		position: relative;
		width: 100%;
		height: calc(100% - 64px);
		overflow: hidden;
		background-color: var(--background-normal-alt);

		&-element {
			position: absolute;
			top: 0;
			left: 0;
			transition: transform 500ms;

			&.left-enter {
				transform: translate(-100%);
			}
			&.left-leave-to {
				transform: translate(100%);
			}
			&.right-enter {
				transform: translate(100%);
			}
			&.right-leave-to {
				transform: translate(-100%);
			}
			&.top-enter {
				transform: translate(0, -100%);
			}
			&.top-leave-to {
				transform: translate(0, 100%);
			}
			&.bottom-enter {
				transform: translate(0, 100%);
			}
			&.bottom-leave-to {
				transform: translate(0, -100%);
			}
			&.left-enter-active
			.left-leave-active
			.right-enter-active
			.right-leave-active
			.top-enter-active
			.top-leave-active
			.bottom-enter-active
			.bottom-leave-active {
				transform: translate(0);
			}
		}
	}
}
</style>
