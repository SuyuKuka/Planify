$('#calendar-body').append(createTimeDiv());
const date = today.getDate();

const daysDiv = $("<div class='calendar-days'></div>");
daysDiv.append(createCurrButton(date));

$('#calendar-body').append(daysDiv);
