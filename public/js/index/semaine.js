const month = today.getMonth();
const day = mod(today.getDay() - 1, 7) + 1;
const prevMonth = days[mod(month - 1, 12)];

const date = today.getDate();
const daysDiv = $("<div id='#calendar-days'></div>");

for (let i = 0; i < 7; i++) {
    const val = date + (i) + 1 - day;
    if (val <= 0) {
        daysDiv.append(createPrevButton(prevMonth - val));
    } else if (val > days[month]) {
        daysDiv.append(createNextButton(val - days[month]));
    } else {
        daysDiv.append(createCurrButton(val));
    }
}

$('#calendar').append(daysDiv);
