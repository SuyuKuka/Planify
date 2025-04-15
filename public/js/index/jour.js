const today = date.getToday();

const daysDiv = $("#calendar-days");
daysDiv.append(createCurrButton(val));

$('#calendar').append(daysDiv);
