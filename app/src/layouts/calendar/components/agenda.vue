<template>
	<div class="agenda-wrapper">
		<div class="agenda" v-if="Object.keys(dayList).length > 0">
			<div class="day" v-for="(day, i) in dayList" :key="i">
				<div class="date">Activity on {{ dateOfIndex[i] }}</div>
				<div class="events">
					<div class="event" v-for="(event, j) in day" :key="j">
						<div class="line">
							<div class="dot" :style="getDotColor(event)" />
						</div>
						<div class="content" @click="onCLick(event)">
							<span class="time" v-if="event.time">{{ event.time.substr(0, 5) }}</span>
							<span class="title">{{ event.data[viewOptions.title] }}</span>
						</div>
					</div>
					<div class="event add">
						<div class="line"><div class="dot" /></div>
						<div class="content" @click="newItem(i)">
							<v-icon name="add"></v-icon>
							{{ $t('layouts.calendar.add-item') }}
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
import color from '@/utils/color';

export default defineComponent({
	components: {},
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
	},
	setup(props) {
		const days = computed(() => {
			const days: Record<string, Record<string, any>[]> = {};

			props.items.forEach((item) => {
				const options = props.viewOptions;
				let day = '0000-00-00';
				let time: string | undefined;

				if (options.isDatetime && options.datetime) {
					const date = new Date(item.data[options.datetime]);
					day = date.toLocaleDateString();
					time = date.toLocaleTimeString();
				} else if (!options.isDatetime && options.date) {
					day = new Date(item.data[options.date]).toLocaleDateString();
					if (options.time) {
						time = new Date(item.data[options.time]).toLocaleTimeString();
					}
				}

				if (time) {
					item.time = time;
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

		return { weekNames, isSameDay, dayList, dateOfIndex, onCLick, days, newItem, getDotColor };

		function getDotColor(item: Record<string, any>) {
			if (props.viewOptions.color && item.data[props.viewOptions.color]) {
				return { 'background-color': item.data[props.viewOptions.color] };
			}
			return {};
		}

		function onCLick(item: Record<string, any>) {
			if (item.link) router.push(item.link);
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

	.event {
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

		.content {
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

			.content {
				border-bottom: none;
			}
		}

		&.add {
			.line .dot {
				background-color: var(--foreground-subdued);
			}

			.content {
				color: var(--foreground-subdued);
			}
		}
	}
}
</style>
