<template>
	<div class="filter-input">
		<div v-if="['between', 'nbetween'].includes(operator)" class="between">
			<div class="field">
				<component
					:is="interfaceComponent"
					:type="type"
					:value="csvValue[0]"
					:placeholder="t('lower_limit')"
					:allow-other="true"
					:choices="choices"
					autofocus
					@input="setCSV(0, $event)"
				/>
			</div>
			<div class="field">
				<component
					:is="interfaceComponent"
					:type="type"
					:value="csvValue[1]"
					:placeholder="t('upper_limit')"
					:allow-other="true"
					:choices="choices"
					autofocus
					@input="setCSV(1, $event)"
				/>
			</div>
		</div>
		<div v-else-if="['in', 'nin'].includes(operator)" class="list">
			<div v-for="(val, index) in csvValue" :key="index" class="field">
				<component
					:is="interfaceComponent"
					:type="type"
					:value="val"
					:placeholder="t('enter_a_value')"
					:disabled="disabled"
					:allow-other="true"
					:choices="choices"
					autofocus
					@input="setCSV(index, $event)"
				/>
				<small class="remove" @click="removeCSV(val)">
					{{ t('remove') }}
				</small>
			</div>

			<v-button outlined full-width dashed :disabled="disabled" @click="addCSV">
				<v-icon name="add" />
				{{ t('add_new') }}
			</v-button>
		</div>
		<template v-else-if="['empty', 'nempty'].includes(operator) === false">
			<component
				:is="interfaceComponent"
				:type="type"
				:value="internalValue"
				:placeholder="t('enter_a_value')"
				:disabled="disabled"
				:choices="choices"
				:allow-other="true"
				autofocus
				@input="internalValue = $event"
			/>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { FilterOperator, Type, Field } from '@directus/shared/types';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';

export default defineComponent({
	props: {
		modelValue: {
			type: [String, Number, Boolean],
			required: true,
		},
		type: {
			type: String as PropType<Type>,
			required: true,
		},
		operator: {
			type: String as PropType<FilterOperator>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		field: {
			type: Object as PropType<Field>,
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const internalValue = computed<string | string[] | boolean | number>({
			get() {
				return props.modelValue;
			},
			set(newValue) {
				emit('update:modelValue', newValue);
			},
		});

		const csvValue = computed({
			get() {
				return typeof props.modelValue === 'string' ? props.modelValue.split(',') : [];
			},
			set(newVal: string[]) {
				internalValue.value = newVal.join(',');
			},
		});

		const choices = computed(() => {
			if (!props.field) return null;
			return props.field?.meta?.options?.choices || null;
		});

		const interfaceComponent = computed(() => {
			if (choices.value) {
				return 'interface-select-dropdown';
			}

			return `interface-${getDefaultInterfaceForType(props.type)}`;
		});

		return { t, internalValue, csvValue, setCSV, removeCSV, addCSV, interfaceComponent, choices };

		function setCSV(index: number, value: string) {
			const newValue = Object.assign([], csvValue.value, { [index]: value });
			csvValue.value = newValue;
		}

		function removeCSV(val: string) {
			csvValue.value = csvValue.value.filter((value) => value !== val);
		}

		function addCSV() {
			csvValue.value = [...csvValue.value, ''];
		}
	},
});
</script>

<style lang="scss" scoped>
.v-input + .v-input,
.v-input + .v-button {
	margin-top: 8px;
}

.v-input .v-icon {
	--v-icon-color: var(--foreground-subdued);
}

.list .field {
	margin-bottom: 12px;
}

.list .field .remove {
	display: flex;
	align-items: center;
	float: right;
	width: max-content;
	margin-bottom: 12px;
	color: var(--foreground-subdued);
	cursor: pointer;
}

.list .field .remove:hover {
	color: var(--danger);
}

.between .field:first-child {
	margin-bottom: 12px;
}
</style>
