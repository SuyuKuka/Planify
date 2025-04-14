const month = today.getMonth();
const day = mod(new Date(year, month, 1).getDay() - 1, 7) + 1;
const prevMonth = days[mod(month - 1, 12)];

const cells = days[month] + (days[month] / 7 >> 0) + 1;
const daysDiv = $("<div id='#calendar-days'></div>");

for (let i = 0; i < cells; i++) {
    const val = i - day + 2;
    if (val <= 0) {
        daysDiv.append(`<button class='prev-calendar'>${prevMonth - val}</button>`);
    } else if (val > days[month]) {
        daysDiv.append(`<button class='next-calendar'>${val - days[month]}</button>`);
    } else {
        daysDiv.append(`<button class='curr-calendar'>${val}</button>`);
    }
}

$('#calendar').append(daysDiv);
