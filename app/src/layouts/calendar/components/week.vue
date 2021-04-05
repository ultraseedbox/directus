<template>
	<div class="week-wrapper">
		<div class="week" :class="{ timeline: hasTimeline }" :style="{ '--week-days': days }">
			<div class="spacer" v-show="hasTimeline"></div>
			<div v-for="index in days" :key="'headers-' + index" class="header" @click="selectDay(index)">
				<div class="header-week">
					{{ $t('weeks.' + getWeekDay(getDate(index))).substr(0, days > 4 ? 3 : 100) }}
				</div>
				<div class="header-day" :class="{ today: isSameDay(today, getDate(index)) }">
					{{ getDate(index).getDate() }}
				</div>
			</div>
			<div class="timeline" v-show="hasTimeline">
				<span v-for="i in 23" :key="i" :style="{ top: (i / 24) * 100 + '%' }">{{ i + ':00' }}</span>
			</div>
			<div v-for="index in days" :key="'events-' + index" class="events">
				<event
					v-for="event in getEvents(index)"
					:key="event.id"
					:value="value"
					@input="$emit('input', $event)"
					:item="event"
					:layout-options="layoutOptions"
					:select-mode="selectMode"
					:collection="collection"
					:absolute="(layoutOptions && layoutOptions.time != null) || layoutOptions.datetime != null"
				></event>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { Interval, weekNames, isSameDay } from '../time';
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
		days: {
			type: Number,
			default: 7,
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
		const today = new Date();

		const currentWeek = ref(props.interval);

		const hasTimeline = computed(
			() => props.layoutOptions && (props.layoutOptions.isDatetime || props.layoutOptions.time != null)
		);

		return {
			weekNames,
			getDate,
			isSameDay,
			today,
			getEvents,
			hasTimeline,
			getWeekDay,
			selectDay,
		};

		function getEvents(index: number) {
			const date = getDate(index);
			if (!props.layoutOptions) return;
			const dateField = props.layoutOptions.isDatetime ? props.layoutOptions.datetime : props.layoutOptions.date;
			if (dateField == undefined) return;
			return props.items.filter((i) => isSameDay(new Date(i.data[dateField]), date));
		}

		function getWeekDay(date: Date) {
			return weekNames[date.getDay() == 0 ? 6 : date.getDay() - 1];
		}

		function getDate(index: number) {
			return currentWeek.value.getDate(index - 1);
		}
		function selectDay(index: number) {
			const date = getDate(index);
			emit('changeView', { date, type: Interval.Type.DAY });
		}
	},
});
</script>

<style lang="scss" scoped>
.week-wrapper {
	width: 100%;
	height: 100%;
	overflow: hidden;
	overflow-y: auto;

	.week {
		display: grid;
		grid-template: 75px 1fr / repeat(var(--week-days), 1fr);
		width: 100%;
		min-height: 200%;

		&.timeline {
			grid-template: 75px 1fr / 40px repeat(var(--week-days), 1fr);
		}

		.spacer {
			position: sticky;
			top: 0;
			z-index: 20;
			background-color: var(--background-page);
		}

		.timeline {
			position: relative;
			z-index: 15;
			width: 100%;
			height: 100%;
			font-size: 12px;
			background-color: var(--background-page);

			span {
				position: absolute;
				left: 50%;
				transform: translate(-50%, -50%);

				&::after {
					position: absolute;
					top: 50%;
					left: 110%;
					width: 100vw;
					height: 1px;
					background-color: var(--background-normal-alt);
					content: '';
				}
			}
		}

		.header {
			position: sticky;
			top: 0;
			z-index: 20;
			width: 100%;
			padding: 10px 5px;
			font-weight: 400;
			font-size: 1.3em;
			background-color: var(--background-page);

			&:hover {
				background-color: var(--background-subdued);
				cursor: pointer;
			}

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
			position: relative;
			background-color: var(--background-page);
			border-left: 1px solid var(--background-normal-alt);

			.event {
				z-index: 16;
			}
		}
	}
}
</style>
