import { ref, Ref } from 'vue';
import { LayoutConfig } from './types';

let layoutsRaw: Ref<LayoutConfig[]>;
let layouts: Ref<LayoutConfig[]>;

export function getLayouts() {
	if (!layoutsRaw) {
		layoutsRaw = ref([]);
	}

	if (!layouts) {
		layouts = ref([]);
	}

	return { layouts, layoutsRaw };
}