<template>
	<div class="day">
		<div class="header">
			<div class="header-week">{{ $t('weeks.' + weekNames[currentDay]) }}</div>
			<div class="header-day" :class="{ today: isSameDay(new Date(), currentDate) }">
				{{ currentDate.getDate() }}
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { weekNames, isSameDay } from '../time';
export default defineComponent({
	props: {
		currentDate: {
			type: Date as PropType<Date>,
			required: true,
		},
		items: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
	},
	setup(props) {
		const currentDay = computed(() => {
			const day = props.currentDate.getDay();
			return day == 0 ? 6 : day - 1;
		});

		return { weekNames, isSameDay, currentDay };
	},
});
</script>

<style lang="scss">
.day {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;

	.header {
		display: flex;
		align-items: center;
		width: 100%;
		height: 64px;
		padding: 0 20px;
		font-size: 16px;
		background-color: var(--background-page);

		&-week {
			color: var(--foreground-subdued);
		}

		&-day {
			margin-left: 12px;
			font-size: 24px;

			&.today {
				border-bottom: 3px solid var(--primary);
			}
		}
	}
}
</style>
