<template>
	<div class="agenda-wrapper">
		<div class="agenda" v-if="Object.keys(dayList).length > 0">
			<div class="day" v-for="(day, i) in dayList" :key="i">
				<div class="date">{{ $t('layouts.calendar.activity-on') }} {{ dateOfIndex[i] }}</div>
				<div class="events">
					<div class="event-container" v-for="(event, j) in day" :key="j">
						<div class="line">
							<div class="dot" :style="getDotColor(event)" />
						</div>
						<event
							:item="event"
							:value="value"
							@input="$emit('input', $event)"
							:view-options="viewOptions"
							:select-mode="selectMode"
							no-style
						/>
					</div>
					<div class="event-container add">
						<div class="line"><div class="dot" /></div>
						<div class="event" @click="newItem(i)">
							{{ $t('layouts.calendar.add-item') }}
							<v-icon name="add"></v-icon>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div v-else class="no-events">
			<span>{{ $t('layouts.calendar.no-events') }}</span>
			<span>
				{{ interval.getStart().toLocaleDateString() }} {{ $t('layouts.calendar.and') }}
				{{ interval.getEnd().toLocaleDateString() }}
			</span>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { weekNames, isSameDay, Interval } from '../time';
import { ViewOptions } from '../calendar.vue';
import router from '@/router';
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
		collection: {
			type: String,
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
	},
	setup(props) {
		const days = computed(() => {
			const days: Record<string, Record<string, any>[]> = {};

			props.items.forEach((item) => {
				const options = props.viewOptions;
				let day = '0000-00-00';

				if (options.isDatetime && options.datetime) {
					const date = new Date(item.data[options.datetime]);
					day = date.toLocaleDateString();
				} else if (!options.isDatetime && options.date) {
					day = new Date(item.data[options.date]).toLocaleDateString();
				}

				if (Object.keys(days).includes(day)) {
					days[day] = [item, ...days[day]];
				} else {
					days[day] = [item];
				}
			});

			return days;
		});

		const dayList = computed(() => {
			return Object.values(days.value).reverse();
		});
		const dateOfIndex = computed(() => {
			return Object.keys(days.value).reverse();
		});

		return { weekNames, isSameDay, dayList, dateOfIndex, days, newItem, getDotColor };

		function getDotColor(item: Record<string, any>) {
			if (props.viewOptions.color && item.data[props.viewOptions.color]) {
				return { 'background-color': item.data[props.viewOptions.color] };
			}
			return {};
		}

		function newItem(index: number) {
			const dateField = props.viewOptions.isDatetime ? props.viewOptions.datetime : props.viewOptions.date;
			if (!dateField) return;
			const date = new Date(dayList.value[index][0][dateField].substr(0, 10));

			router.push(`/collections/${props.collection}/+?${dateField}=${date.toISOString()}`);
		}
	},
});
</script>

<style lang="scss" scoped>
.agenda-wrapper {
	display: flex;
	width: 100%;
	height: 100%;
	overflow-y: auto;
	background-color: var(--background-page);

	.agenda {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.no-events {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
}

.day {
	position: relative;
	background-color: var(--background-page);

	.date {
		position: sticky;
		top: 0;
		z-index: 2;
		padding: 19px 32px;
		font-size: 16px;
		background-color: var(--background-page);
		border-bottom: 2px solid var(--background-normal-alt);
	}
}

.events {
	padding: 15px 0;

	.event-container {
		position: relative;

		.line {
			position: absolute;
			top: 17px;
			left: 36px;
			width: 2px;
			height: 102%;
			background-color: var(--background-normal-alt);
			-webkit-transform: translate(-50%);
			transform: translate(-50%);

			.dot {
				position: relative;
				top: 6px;
				z-index: 10;
				width: 13px;
				height: 13px;
				margin-left: 50%;
				background-color: var(--primary);
				border: 2px solid var(--background-page);
				border-radius: 50%;
				transform: translate(-50%, -50%);
			}
		}

		::v-deep .event {
			display: flex;
			flex-direction: row-reverse;
			justify-content: flex-end;
			margin: 0 32px 0 52px;
			padding: 12px;
			border-bottom: 2px solid var(--background-normal-alt);
			cursor: pointer;

			&:hover {
				background-color: var(--background-subdued);
			}

			.time {
				margin-right: 10px;
				color: var(--foreground-subdued);
			}
		}

		&:last-child {
			.line {
				background-color: transparent;
			}

			.event-container {
				border-bottom: none;
			}
		}

		&.add {
			.line .dot {
				background-color: var(--foreground-subdued);
			}

			.event-container {
				color: var(--foreground-subdued);
			}
		}
	}
}
</style>
