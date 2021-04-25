<template>
	<EditorContent :editor="editorRef" />
</template>

<script lang="ts">
import { defineComponent, onMounted, watch, ref } from '@vue/composition-api';

import { Editor, EditorContent } from '@tiptap/vue-2';
import { defaultExtensions } from '@tiptap/starter-kit';

export default defineComponent({
	components: { EditorContent },
	props: {
		value: {
			type: Object,
		},
	},
	setup(props, { emit }) {
		const editorRef = ref<any | null>(null);
		editorRef.value = new Editor({
			extensions: defaultExtensions(),
			content: props.value,
			onUpdate: () => {
				emit('input', editorRef.value.getJSON());
			},
		});

		onMounted(() => {
			editorRef.value.commands.setContent(props.value, false);
		});

		watch(
			() => props.value,
			(newValue) => {
				editorRef.value?.commands.setContent(newValue, false);
			}
		);

		return {
			editorRef,
		};
	},
});
</script>
