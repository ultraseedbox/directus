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
export { weekNames, monthNames, isSameWeek, isSameMonth, isSameDay, isSameYear, Week };

function isSameYear(day1: Date, day2: Date) {
	return day1.getFullYear() == day2.getFullYear();
}

function isSameMonth(day1: Date, day2: Date) {
	return isSameYear(day1, day2) && day1.getMonth() == day2.getMonth();
}

function isSameWeek(day1: Date, day2: Date) {
	return new Week(day1).isSameWeek(day2);
}

function isSameDay(day1: Date, day2: Date) {
	return isSameMonth(day1, day2) && day1.getDate() == day2.getDate();
}

class Week {
	start: Date;
	end: Date;

	constructor(date: Date) {
		const year = date.getFullYear();
		const month = date.getMonth();
		const day = date.getDay();
		const diff = date.getDate() - day + (day == 0 ? -6 : 1);
		this.start = new Date(year, month, diff);
		this.end = new Date(year, month, diff + 7);
	}
	isSameWeek(date: Date) {
		return this.start <= date && this.end > date;
	}

	getDayOfWeek(index: number) {
		const date = new Date(this.start.getTime());
		date.setDate(date.getDate() + index);
		return date;
	}
}
