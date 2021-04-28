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
