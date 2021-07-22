import { defineDisplay } from '@directus/shared/utils/browser';
import handler from './handler';

export default defineDisplay({
	id: 'filesize',
	name: '$t:displays.filesize.filesize',
	description: '$t:displays.filesize.description',
	icon: 'description',
	handler: handler,
	options: [],
	types: ['integer'],
});
