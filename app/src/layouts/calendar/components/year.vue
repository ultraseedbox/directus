<template>
	<div class="year-wrapper">
		<div class="year">
			<div class="month" v-for="(month, i) in months" :key="i" @click="selectMonth(i + 1)">
				<span class="name">{{ $t(`months.${monthNames[i]}`) }}</span>
				<div class="days">
					<div
						class="day"
						v-for="d in 42"
						:key="d"
						:class="{
							events: hasEvents(getDate(month, d)),
							hidden: !month.isInInterval(getDate(month, d)),
							today: isSameDay(new Date(), getDate(month, d)),
						}"
					>
						{{ getDate(month, d).getDate() }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { weekNames, Interval, monthNames, isSameDay } from '../time';
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
			required: true,
		},
		items: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
		currentDate: {
			type: Date as PropType<Date>,
			default: null,
		},
		collection: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const currentDay = computed(() => {
			const day = props.interval.getStart().getDay();
			return day == 0 ? 6 : day - 1;
		});

		const months = computed(() => {
			const currentYear = props.interval.getStart().getFullYear();
			const months: Interval[] = [];
			for (let i = 0; i < 12; i++) {
				months.push(new Interval(new Date(currentYear, i, 1), Interval.Type.MONTH));
			}
			return months;
		});

		return { weekNames, currentDay, monthNames, hasEvents, selectMonth, months, monthBegin, getDate, isSameDay };

		function hasEvents(date: Date) {
			const dateField = props.layoutOptions.isDatetime ? props.layoutOptions.datetime : props.layoutOptions.date;
			if (dateField == undefined) return;
			return props.items.filter((item) => isSameDay(new Date(item.data[dateField]), date)).length > 0;
		}

		function selectMonth(index: number) {
			const date = new Date(props.interval.getStart().getFullYear(), index - 1, 1);
			const type = Interval.Type.MONTH;
			emit('changeView', { date, type });
		}

		function getDate(month: Interval, day: number) {
			const begin = monthBegin(month);
			return month.getDate(day - begin);
		}

		function monthBegin(month: Interval) {
			const day = month.getStart().getDay();
			return day == 0 ? 7 : day;
		}
	},
});
</script>

<style lang="scss" scoped>
.year-wrapper {
	width: 100%;
	height: 100%;
	overflow-y: auto;

	.year {
		display: grid;
		grid-template: repeat(3, 1fr) / repeat(4, 1fr);
		width: 100%;
		min-height: 100%;
		padding: 0 20px;
		background-color: var(--background-page);

		.month {
			display: flex;
			flex-direction: column;
			padding: 10px;
			cursor: pointer;

			&:hover {
				background-color: var(--background-subdued);
			}

			.name {
				font-size: 16px;
			}

			.days {
				display: grid;
				grid-template: repeat(6, 1fr) / repeat(7, 1fr);

				.day {
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 11px;

					&.hidden {
						opacity: 50%;
					}

					&.today {
						position: relative;
						z-index: 2;
						color: var(--foreground-inverted);

						&::before {
							position: absolute;
							z-index: -1;
							width: 25px;
							height: 25px;
							background-color: var(--primary);
							border-radius: 50%;
							content: '';
						}
					}

					&.events:not(.today):not(.hidden) {
						position: relative;

						&::before {
							position: absolute;
							top: 1px;
							right: 10%;
							width: 8px;
							height: 8px;
							background-color: var(--primary);
							border-radius: 50%;
							content: '';
						}
					}
				}
			}
		}

		@media (max-width: 800px) {
			grid-template: repeat(6, 1fr) / repeat(2, 1fr);
		}

		@media (max-width: 400px) {
			grid-template: repeat(12, 1fr) / repeat(1, 1fr);
		}
	}
}
</style>
