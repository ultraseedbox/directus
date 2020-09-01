<template>
	<div class="event" @click="onClick" :style="style" :class="{ absolute }">
		<span class="title">{{ item.data[viewOptions.title] }}</span>
		<span v-if="time" class="time">{{ time.substr(0, 5) }}</span>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRefs } from '@vue/composition-api';
import { weekNames, isSameDay, Interval } from '../time';
import router from '@/router';
import { ViewOptions } from '../calendar.vue';
import { boolean } from '@storybook/addon-knobs';

export default defineComponent({
	props: {
		viewOptions: {
			type: Object as PropType<ViewOptions>,
			required: true,
		},
		item: {
			type: Object as PropType<Record<string, any>>,
			default: null,
		},
		absolute: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const { viewOptions, item, absolute } = toRefs(props);
		const absolueTop = computed(() => {
			if (!props.absolute || !time.value) return 0;

			const timeSections = time.value.split(':');

			const hours = Number(timeSections[0]),
				minutes = Number(timeSections[1]);

			const percent = (hours * 60 + minutes) / (24 * 60);
			return percent * 100;
		});

		const color = computed<string | undefined>(() => {
			if (props.viewOptions.color && props.item.data[props.viewOptions.color]) {
				return props.item.data[props.viewOptions.color];
			}
			return undefined;
		});

		const style = computed(() => {
			const style: Record<string, any> = {};
			if (props.absolute) {
				style['top'] = absolueTop.value + '%';
				style['transform'] = `translate(0, ${-absolueTop.value}%)`;
			}
			if (color.value && color.value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i) != null) {
				style['background-color'] = color.value;
			} else {
				style['background-color'] = '';
			}
			return style;
		});

		const time = computed(() => {
			const isDatetime = viewOptions.value.isDatetime;
			const datetime = viewOptions.value.datetime;
			const time = viewOptions.value.time;

			let timeString = '00:00:00';

			if (isDatetime) {
				if (!datetime) return;
				timeString = props.item.data[datetime].split(/(T|\.)/g)[2];
			} else {
				if (!time) return;
				timeString = props.item.data[time];
			}
			return timeString;
		});

		return { style, onClick, time };

		function onClick() {
			if (props.item.link) router.push(props.item.link);
		}
	},
});
</script>

<style lang="scss" scoped>
.event {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 90%;
	height: 20px;
	margin: 0 5% 2px;
	padding: 2px 6px;
	color: var(--foreground-inverted);
	font-size: 12px;
	line-height: 14px;
	background-color: var(--primary);
	border-radius: var(--border-radius);
	cursor: pointer;

	&.absolute {
		position: absolute;
		left: 0;

		&:hover {
			z-index: 1;
		}
	}

	.title {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
}
</style>
