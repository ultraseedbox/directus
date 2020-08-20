import { defineLayout } from '@/layouts/define';
import CalendarLayout from './calendar.vue';

export default defineLayout(({ i18n }) => ({
	id: 'calendar',
	name: i18n.t('layouts.calendar.calendar'),
	icon: 'grid_4',
	component: CalendarLayout,
}));
