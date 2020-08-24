<template>
	<div class="week">
		<div v-for="index in 7" :key="index" class="week-day">
			<div class="header">
				<div class="header-week">{{ $t('weeks.' + weekNames[index - 1]).substr(0, 3) }}</div>
				<div class="header-day" :class="{ today: isSameDay(today, getDate(index)) }">
					{{ getDate(index).getDate() }}
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Week, weekNames, isSameDay } from '../time';

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
		const today = new Date();

		const currentWeek = computed(() => {
			return new Week(props.currentDate);
		});

		return {
			weekNames,
			getDate,
			isSameDay,
			today,
		};

		function getDate(index: number) {
			return currentWeek.value.getDayOfWeek(index - 1);
		}
	},
});
</script>

<style lang="scss">
.week {
	display: grid;
	grid-gap: 1px;
	grid-template: 1fr / repeat(7, 1fr);
	width: 100%;
	min-height: 100%;
	border: 1px solid var(--background-normal-alt);

	&-day {
		background-color: var(--background-page);

		.header {
			width: 100%;
			padding: 10px 5px;
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
	}
}
</style>
