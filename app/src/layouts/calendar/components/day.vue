<template>
	<div class="day">
		<div class="header">
			<div class="header-week">{{ $t('weeks.' + weekNames[currentDay]) }}</div>
			<div class="header-day" :class="{ today: interval.isInInterval(new Date()) }">
				{{ interval.getStart().getDate() }}
			</div>
		</div>
		<div class="events">
			<event v-for="item in items" :key="item.id" :item="item" :viewOptions="viewOptions"></event>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { weekNames, isSameDay, Interval } from '../time';
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
		const currentDay = computed(() => {
			const day = props.interval.getStart().getDay();
			return day == 0 ? 6 : day - 1;
		});

		return { weekNames, isSameDay, currentDay };
	},
});
</script>

<style lang="scss">
.day {
	display: flex;
	width: 100%;
	height: 100%;

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100px;
		height: 100%;
		padding: 20px 0;
		font-size: 16px;
		background-color: var(--background-page);

		&-week {
			color: var(--foreground-subdued);
		}

		&-day {
			margin-top: 12px;
			font-size: 24px;

			&.today {
				border-bottom: 3px solid var(--primary);
			}
		}
	}
}
</style>
