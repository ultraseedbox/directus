<template>
	<div
		class="event"
		@click="onClick"
		:style="style"
		:class="{ absolute, 'no-style': noStyle, selected: value.length > 0 }"
	>
		<span class="title" v-if="item !== null && collection !== null && layoutOptions.title !== null">
			<render-template :collection="collection" :item="item.data" :template="layoutOptions.title" />
		</span>
		<span v-if="time" class="time">{{ time.substr(0, 5) }}</span>
		<div class="selection">
			<v-icon :name="selectionIcon" @click.stop="toggleSelection" :small="!noStyle" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRefs } from '@vue/composition-api';
import router from '@/router';
import { LayoutOptions } from '../calendar.vue';

export default defineComponent({
	props: {
		layoutOptions: {
			type: Object as PropType<LayoutOptions>,
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
		noStyle: {
			type: Boolean,
			default: false,
		},
		selectMode: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			default: null,
		},
		value: {
			type: Array as PropType<(string | number)[]>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const absolueTop = computed(() => {
			if (!props.absolute || !time.value) return 0;

			const timeSections = time.value.split(':');

			const hours = Number(timeSections[0]),
				minutes = Number(timeSections[1]);

			const percent = (hours * 60 + minutes) / (24 * 60);
			return percent * 100;
		});

		const selectionIcon = computed(() => {
			if (!props.item) return 'radio_button_unchecked';

			return props.value.includes(props.item.data[props.item.primaryKeyField])
				? 'check_circle'
				: 'radio_button_unchecked';
		});

		const color = computed<string | undefined>(() => {
			if (props.layoutOptions.color && props.item.data[props.layoutOptions.color]) {
				return props.item.data[props.layoutOptions.color];
			}
			return undefined;
		});

		const style = computed(() => {
			const style: Record<string, any> = {};
			if (props.absolute) {
				style['top'] = absolueTop.value + '%';
				style['transform'] = `translate(0, ${-absolueTop.value}%)`;
			}
			if (props.noStyle === false && color.value && color.value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i) != null) {
				style['background-color'] = color.value;
			} else {
				style['background-color'] = '';
			}
			return style;
		});

		const time = computed(() => {
			const isDatetime = props.layoutOptions.isDatetime;
			const datetime = props.layoutOptions.datetime;
			const time = props.layoutOptions.time;

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

		return { style, onClick, time, selectionIcon, toggleSelection };

		function toggleSelection() {
			if (!props.item) return null;

			if (props.value.includes(props.item.data[props.item.primaryKeyField])) {
				emit(
					'input',
					props.value.filter((key) => key !== props.item.data[props.item.primaryKeyField])
				);
			} else {
				emit('input', [...props.value, props.item.data[props.item.primaryKeyField]]);
			}
		}

		function onClick() {
			if (props.selectMode) {
				toggleSelection();
			} else {
				router.push(props.item.link);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.event {
	position: relative;

	.selection {
		position: absolute;
		top: 0;
		left: 0;
		display: none;
		align-items: center;
		height: 100%;
		padding-right: 40px;
		padding-left: 10px;
		background: linear-gradient(to right, rgba(38, 50, 56, 0.6), rgba(38, 50, 56, 0));

		.v-icon {
			color: var(--background-page);
		}
	}

	&:not(.no-style) {
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

		.selection {
			padding-left: 5px;
			border-radius: var(--border-radius);
		}
	}

	&.no-style .selection {
		padding-right: 60px;
	}

	&:hover .selection,
	&.selected .selection {
		display: flex;
	}
}
</style>
