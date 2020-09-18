<template>
	<div class="months">
		<div
			v-for="index in 42"
			:key="index"
			class="months-day"
			:class="{ hidden: !interval.isInInterval(getDate(index)) }"
			@click="selectDay(index)"
		>
			<div class="header">
				<div v-if="index < 8" class="header-week">{{ $t('weeks.' + getWeek(index)).substr(0, 3) }}</div>
				<div class="header-day" :class="{ today: isSameDay(new Date(), getDate(index)) }">
					{{ getDate(index).getDate() }}
				</div>
			</div>
			<div class="events">
				<event
					v-for="event in getEvents(index)"
					:key="event.id"
					:item="event"
					:value="value"
					@input="$emit('input', $event)"
					:select-mode="selectMode"
					:layout-options="layoutOptions"
					:collection="collection"
				></event>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { weekNames, isSameDay, Interval } from '../time';
import { LayoutOptions } from '../calendar.vue';
import Event from './event.vue';

export default defineComponent({
	components: { Event },
	props: {
		interval: {
			type: Interval,
			required: true,
		},
		layoutOptions: {
			type: Object as PropType<LayoutOptions>,
			default: null,
		},
		items: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
		selectMode: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Array as PropType<(string | number)[]>,
			default: () => [],
		},
		collection: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const currentMonth = ref(props.interval);

		const monthBegin = computed(() => {
			const day = currentMonth.value.getStart().getDay();
			return day == 0 ? 7 : day;
		});

		return {
			getDate,
			getWeek,
			isSameDay,
			getEvents,
			selectDay,
		};

		function getEvents(index: number) {
			const date = getDate(index);
			if (!props.layoutOptions) return [];
			const dateField = props.layoutOptions.isDatetime ? props.layoutOptions.datetime : props.layoutOptions.date;
			if (dateField == undefined) return [];
			return props.items.filter((i) => isSameDay(new Date(i.data[dateField]), date));
		}

		function getDate(index: number) {
			return currentMonth.value.getDate(index - monthBegin.value);
		}

		function getWeek(index: number) {
			return weekNames[index - (1 % 7)];
		}

		function selectDay(index: number) {
			const date = getDate(index);
			emit('changeView', { date, type: Interval.Type.DAY });
		}
	},
});
</script>

<style lang="scss" scoped>
.months {
	display: grid;
	grid-gap: 1px;
	grid-template: repeat(6, 1fr) / repeat(7, 1fr);
	width: 100%;
	height: 100%;
	border: 1px solid var(--background-normal-alt);

	&-day {
		overflow: hidden;
		background-color: var(--background-page);

		&.hidden {
			opacity: 0.5;
		}

		&:hover:not(.hidden) {
			background-color: var(--background-subdued);
			cursor: pointer;
		}

		.header {
			width: 100%;
			padding: 5px 3px;
			font-weight: 400;
			font-size: 1.3em;

			&-week {
				width: 32px;
				color: var(--foreground-subdued);
				font-size: 0.7em;
				text-align: center;
			}

			&-day {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 32px;
				height: 32px;

				&.today {
					border: 2px solid var(--foreground-normal);
					border-radius: 50%;
				}
			}
		}

		.events {
			max-width: 100%;
			padding: 0 5%;

			.event {
				max-width: 90%;
			}
		}
	}
}
</style>
