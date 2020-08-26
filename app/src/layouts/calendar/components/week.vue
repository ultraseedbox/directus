<template>
	<div class="week-wrapper">
		<div class="week" :class="{ timeline: hasTimeline }">
			<div class="spacer" v-show="hasTimeline"></div>
			<div v-for="index in 7" :key="'headers-' + index" class="header">
				<div class="header-week">{{ $t('weeks.' + weekNames[index - 1]).substr(0, 3) }}</div>
				<div class="header-day" :class="{ today: isSameDay(today, getDate(index)) }">
					{{ getDate(index).getDate() }}
				</div>
			</div>
			<div class="timeline" v-show="hasTimeline">
				<span v-for="i in 23" :key="i" :style="{ top: (i / 24) * 100 + '%' }">{{ i + ':00' }}</span>
			</div>
			<div v-for="index in 7" :key="'events-' + index" class="events">
				<event
					v-for="event in getEvents(index)"
					:key="event.id"
					:item="event"
					:viewOptions="viewOptions"
					absolute
				></event>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { Interval, weekNames, isSameDay } from '../time';
import { ViewOptions } from '../calendar.vue';
import Event from './event.vue';

export default defineComponent({
	components: { Event },
	props: {
		interval: {
			type: Interval,
			required: true,
		},
		viewOptions: {
			type: Object as PropType<ViewOptions>,
			required: true,
		},
		items: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
	},
	setup(props) {
		const today = new Date();

		const currentWeek = ref(props.interval);

		const hasTimeline = computed(() => props.viewOptions.isDatetime || props.viewOptions.time != null);

		return {
			weekNames,
			getDate,
			isSameDay,
			today,
			getEvents,
			hasTimeline,
		};

		function getEvents(index: number) {
			const date = getDate(index);
			const dateField = props.viewOptions.isDatetime ? props.viewOptions.datetime : props.viewOptions.date;
			if (dateField == undefined) return;
			return props.items.filter((i) => isSameDay(new Date(i[dateField]), date));
		}

		function getDate(index: number) {
			return currentWeek.value.getDate(index - 1);
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
		grid-template: 75px 1fr / repeat(7, 1fr);
		width: 100%;
		min-height: 200%;

		&.timeline {
			grid-template: 75px 1fr / 40px repeat(7, 1fr);
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
