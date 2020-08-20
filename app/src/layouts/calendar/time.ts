const monthNames = [
	'january',
	'february',
	'march',
	'april',
	'may',
	'june',
	'july',
	'august',
	'september',
	'october',
	'november',
	'december',
];
const weekNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export { weekNames, monthNames, isSameMonth, isSameDay, isSameYear, isSameWeek };

function isSameYear(day1: Date, day2: Date) {
	return day1.getFullYear() == day2.getFullYear();
}

function isSameMonth(day1: Date, day2: Date) {
	return isSameYear(day1, day2) && day1.getMonth() == day2.getMonth();
}

function isSameWeek(day1: Date, day2: Date) {
	return false;
}

function isSameDay(day1: Date, day2: Date) {
	return isSameMonth(day1, day2) && day1.getDate() == day2.getDate();
}
