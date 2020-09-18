<template>
	<week
		:interval="interval"
		:layout-options="layoutOptions"
		:items="items"
		:days="1"
		:select-mode="selectMode"
		:value="value"
		:collection="collection"
		@input="$emit('input', $event)"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Interval } from '../time';
import { LayoutOptions } from '../calendar.vue';
import Week from './week.vue';

export default defineComponent({
	components: { Week },
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
		selectMode: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Array as PropType<(string | number)[]>,
			default: () => [],
		},
		collection: {
			type: String,
			default: null,
		},
	},
});
</script>
