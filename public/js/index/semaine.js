const month = today.getMonth();
const day = mod(today.getDay() - 1, 7) + 1;
const prevMonth = days[mod(month - 1, 12)];

const date = today.getDate();
const daysDiv = $("#calendar-days");

for (let i = 0; i < 7; i++) {
    const val = date + (i) + 1 - day;
    if (val <= 0) {
        daysDiv.append(`<button class='prev-calendar'>${prevMonth - val}</button>`);
    } else if (val > days[month]) {
        daysDiv.append(`<button class='next-calendar'>${val - days[month]}</button>`);
    } else {
        daysDiv.append(`<button class='curr-calendar'>${val}</button>`);
    }
}
