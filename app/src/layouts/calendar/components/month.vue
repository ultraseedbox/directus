<template>
	<div class="months">
		<div
			v-for="index in 42"
			:key="index"
			class="months-day"
			:class="{ hidden: !isSameMonth(currentDate, getDate(index)) }"
		>
			<div class="header">
				<div v-if="index < 8" class="header-week">{{ $t('weeks.' + getWeek(index)).substr(0, 3) }}</div>
				<div class="header-day" :class="{ today: isSameDay(today, getDate(index)) }">
					{{ getDate(index).getDate() }}
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { weekNames, isSameDay, isSameMonth } from '../time';

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

		const monthBegin = computed(() => {
			const cDate = props.currentDate;
			const day = new Date(cDate.getFullYear(), cDate.getMonth(), 1).getDay();
			return day == 0 ? 7 : day;
		});

		const monthLength = computed(() => {
			const cDate = props.currentDate;
			return new Date(cDate.getFullYear(), cDate.getMonth(), 1).getDate();
		});

		return {
			today,
			getDate,
			getWeek,
			isSameDay,
			isSameMonth,
		};

		function getDate(index: number) {
			const cDate = props.currentDate;
			return new Date(cDate.getFullYear(), cDate.getMonth(), index - monthBegin.value + 1);
		}

		function getWeek(index: number) {
			return weekNames[index - (1 % 7)];
		}
	},
});
</script>

<style lang="scss">
.months {
	display: grid;
	grid-gap: 1px;
	grid-template: repeat(6, 1fr) / repeat(7, 1fr);
	width: 100%;
	height: 100%;
	border: 1px solid var(--background-normal-alt);

	&-day {
		background-color: var(--background-page);

		&.hidden {
			opacity: 0.5;
		}

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
