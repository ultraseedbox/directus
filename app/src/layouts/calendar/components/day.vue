<template>
	<week :interval="interval" :view-options="viewOptions" :items="items" :days="1"></week>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Interval } from '../time';
import { ViewOptions } from '../calendar.vue';
import Week from './week.vue';

export default defineComponent({
	components: { Week },
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
});
</script>
