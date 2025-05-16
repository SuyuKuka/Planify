const date = today.getDate();

const daysDiv = $("<div id='#calendar-days'></div>");
daysDiv.append(createCurrButton(date));

$('#calendar').append(daysDiv);
