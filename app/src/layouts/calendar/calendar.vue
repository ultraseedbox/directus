<template>
	<div class="calendar">
		<portal to="layout-options">
			<div class="layout-option">
				<div class="option-label">{{ $t('layouts.calendar.animations') }}</div>
				<v-switch
					v-model="animations"
					:label="$t(`layouts.calendar.animations-${animations ? 'enabled' : 'disabled'}`)"
				></v-switch>
			</div>

			<div class="layout-option">
				<v-tabs v-model="isDatetimeTabs">
					<v-tab style="padding: unset;">{{ $t('layouts.calendar.date-time') }}</v-tab>
					<v-tab style="padding: unset;">{{ $t('layouts.calendar.datetime') }}</v-tab>
				</v-tabs>
			</div>

			<div class="layout-option" v-if="isDatetime">
				<div class="option-label">{{ $t('layouts.calendar.datetime') }}</div>
				<v-select
					v-model="datetime"
					show-deselect
					item-value="field"
					item-text="name"
					:items="getFieldsWithType(['dateTime'])"
				/>
			</div>

			<div class="layout-option" v-if="!isDatetime">
				<div class="option-label">{{ $t('layouts.calendar.date') }}</div>
				<v-select
					v-model="date"
					show-deselect
					item-value="field"
					item-text="name"
					:items="getFieldsWithType(['date'])"
				/>
			</div>

			<div class="layout-option" v-if="!isDatetime">
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
					<v-icon name="arrow_back" @click="backwards"></v-icon>
					<v-icon name="arrow_forward" @click="forwards"></v-icon>
				</div>
				<div class="currentDate">
					<span v-show="viewType !== 'year'">{{ $t('months.' + monthNames[currentDate.getMonth()]) }}</span>
					<v-select v-model="selectedYear" :items="yearOptions" inline></v-select>
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
					:class="{ animations }"
					:interval="interval"
					:view-options="viewOptions"
					:select-mode="selectMode"
					:items="itemsWithInfo"
					:collection="collection"
					v-model="_selection"
					@changeView="onChangeView"
					@wheel.native="throttledScroll($event)"
				/>
			</transition>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, computed, ref, watch, onMounted } from '@vue/composition-api';
import { Filter } from '@/types';
import useSync from '@/composables/use-sync/';
import useCollection from '@/composables/use-collection/';
import useItems from '@/composables/use-items';

import i18n from '@/lang';
import { monthNames, isSameDay, isSameMonth, Interval, nextInterval } from './time';
import Day from './components/day.vue';
import Week from './components/week.vue';
import Month from './components/month.vue';
import Agenda from './components/agenda.vue';
import Year from './components/year.vue';
import { throttle } from 'lodash';

type Item = Record<string, any>;

export type ViewOptions = {
	isAgenda: boolean;
	isDatetime: boolean;
	datetime?: string;
	animations: boolean;
	date?: string;
	time?: string;
	title?: string;
	color?: string;
};

type ViewQuery = {
	fields?: string[];
	limit?: number;
};

export default defineComponent({
	components: { Month, Week, Day, Agenda, Year },
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

		const _selection = useSync(props, 'selection', emit);
		const _viewOptions = useSync(props, 'viewOptions', emit);
		const _viewQuery = useSync(props, 'viewQuery', emit);
		const _filters = useSync(props, 'filters', emit);

		const { collection, searchQuery } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const availableFields = computed(() => fieldsInCollection.value.filter((field) => field.meta.hidden !== true));

		const { isAgenda, isDatetime, animations, date, time, datetime, title, color } = useViewOptions();
		const { limit, fields } = useViewQuery();

		const sort = computed(() => {
			const sortField = isDatetime.value ? datetime.value : date.value;
			let sortString = '';

			if (datetime.value || date.value) {
				sortString += '-' + availableFields.value.find((f) => f.field == sortField)?.field;

				if (!isDatetime.value && time.value) {
					sortString += ',-' + availableFields.value.find((f) => f.field == time.value)?.field;
				}
			}
			return sortString;
		});

		const isDatetimeTabs = computed({
			get() {
				return [Number(isDatetime.value)];
			},
			set(newValue: number[]) {
				isDatetime.value = Boolean(newValue[0]);
			},
		});

		const { items, loading, error, totalPages, itemCount } = useItems(collection, {
			sort,
			limit,
			page: ref(0),
			fields: fields,
			filters: _filters,
			searchQuery,
		});

		const currentDate = ref(new Date());
		watch(currentDate, updateFilters);

		const swipeTo = ref<'left' | 'right' | 'top' | 'bottom'>('left');

		const _viewType = ref<Interval.Type>(isAgenda.value ? Interval.Type.AGENDA : Interval.Type.MONTH);
		const viewType = computed({
			get() {
				return _viewType.value;
			},
			set(newVal: Interval.Type) {
				const typeToInt = { year: 0, agenda: 1, month: 2, week: 3, day: 4 };
				swipeTo.value = typeToInt[newVal] < typeToInt[_viewType.value] ? 'top' : 'bottom';
				isAgenda.value = newVal == 'agenda';
				_viewType.value = newVal;
				updateFilters();
			},
		});

		const viewSelection = computed(() => {
			return [
				{ text: i18n.t('layouts.calendar.year'), value: 'year' },
				{ text: i18n.t('layouts.calendar.agenda'), value: 'agenda' },
				{ text: i18n.t('layouts.calendar.month'), value: 'month' },
				{ text: i18n.t('layouts.calendar.week'), value: 'week' },
				{ text: i18n.t('layouts.calendar.day'), value: 'day' },
			];
		});

		const interval = computed(() => new Interval(currentDate.value, viewType.value));
		const dateField = computed(() => (isDatetime.value ? datetime.value : date.value));

		const itemsWithInfo = computed(() => {
			const itemRef: Record<string, any>[] = items.value;
			const itemList: { data: Record<string, any>; link: string; primaryKeyField: string }[] = [];

			itemRef.forEach((item) => {
				const itemWithInfo = {
					data: item,
					link: getLinkForItem(item),
					primaryKeyField: primaryKeyField.value.field,
				};
				itemList.push(itemWithInfo);
			});
			return itemList;
		});

		const selectedYear = computed({
			get() {
				return currentDate.value.getFullYear();
			},
			set(newVal: number) {
				const newDate = new Date(currentDate.value.getTime());
				newDate.setFullYear(newVal);
				currentDate.value = newDate;
			},
		});

		// Creates an Interval (-10 | +10) for the current year.
		const yearOptions = computed(() => {
			const currentYear = currentDate.value.getFullYear();
			const options: { text: string; value: number }[] = [];
			for (let i = currentYear - 10; i <= currentYear + 10; i++) {
				options.push({ text: i.toString(), value: i });
			}
			return options;
		});

		function onScroll(event: WheelEvent) {
			if (viewType.value != Interval.Type.MONTH) return;
			if (event.deltaY > 0) forwards();
			else backwards();
		}

		const throttledScroll = throttle(onScroll, 300);

		return {
			_selection,
			itemsWithInfo,
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
			onChangeView,
			yearOptions,
			selectedYear,
			throttledScroll,
			animations,
		};

		function onChangeView({ date, type }: { date: Date; type: Interval.Type }) {
			currentDate.value = date;
			viewType.value = type;
		}

		function resetCurrentDate() {
			const now = new Date();
			const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			swipeTo.value = newDate < currentDate.value ? 'left' : 'right';
			currentDate.value = newDate;
		}

		function forwards() {
			swipeTo.value = 'right';
			const [currentMonth, currentDay] = [currentDate.value.getMonth(), currentDate.value.getDate()];
			const { month, day } = nextInterval(viewType.value);
			currentDate.value = new Date(currentDate.value.getFullYear(), currentMonth + month, currentDay + day);
		}

		function backwards() {
			swipeTo.value = 'left';
			const [currentMonth, currentDay] = [currentDate.value.getMonth(), currentDate.value.getDate()];
			const { month, day } = nextInterval(viewType.value);
			currentDate.value = new Date(currentDate.value.getFullYear(), currentMonth - month, currentDay - day);
		}

		function getLinkForItem(item: Record<string, any>) {
			return `/collections/${props.collection}/${item[primaryKeyField.value.field]}`;
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
			const animations = createViewOption<boolean>('animations', true);
			const isAgenda = createViewOption<boolean>('isAgenda', false);
			const isDatetime = createViewOption<boolean>('isDatetime', true);
			const datetime = createViewOption<string>('datetime', null);
			const date = createViewOption<string>('date', null);
			const time = createViewOption<string>('time', null);
			const title = createViewOption<string>('title', null);
			const color = createViewOption<string>('color', null);

			return { datetime, date, time, title, color, isDatetime, isAgenda, animations };

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
			const limit = createViewQueryOption<number>('limit', 500);

			const fields = createViewQueryOption<Array<string>>('fields', ['*']);

			return { limit, fields };

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
	height: calc(100% - (24px * 2) - 65px);
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
				display: flex;
				margin-left: 10px;

				span {
					margin-right: 10px;
				}
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

			&.animations {
				transition: transform 500ms;
			}
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
