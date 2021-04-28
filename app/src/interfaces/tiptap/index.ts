import InterfaceTiptap from './tiptap.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface({
	id: 'tiptap',
	name: '$t:interfaces.tiptap.tiptap',
	description: '$t:interfaces.tiptap.description',
	icon: 'waves',
	component: InterfaceTiptap,
	types: ['json'],
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
			},
			schema: {
				default_value: 'Write something...',
			},
		},
		{
			field: 'imageToken',
			name: '$t:interfaces.markdown.imageToken',
			type: 'string',
			meta: {
				note: '$t:interfaces.markdown.imageToken_label',
				width: 'full',
				interface: 'text-input',
			},
		},
	],
});
