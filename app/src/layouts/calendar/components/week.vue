<template>
	<div class="week">
		This is the Week view!
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
	props: {
		currentDate: {
			type: Date,
			required: true,
		},
		items: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
	},
	setup() {
		return {};
	},
});
</script>

<style lang="scss">
.week {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	font-size: 44px;
	background-color: var(--background-page);
	border: 5px dashed black;
}
</style>
