function createMonthDiv(i) {
    const monthDiv = $("<div class='calendar-days'></div>");
    const daysInMonth = new Date(year, i + 1, 0).getDate();
    for (let val = 1; val <= daysInMonth; val++) {
        monthDiv.append(createCurrButton(val));
    }
    return monthDiv;
}
for (let i = 0; i < 12; i++) {
    $('#calendar').append(createMonthDiv(i));
}
$('#calendar').append(daysDiv);
