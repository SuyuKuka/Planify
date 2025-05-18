let month = today.getMonth();
let day = mod(today.getDay() - 1, 7) + 1;
let prevMonth = days[mod(month - 1, 12)];
let date = today.getDate();

function getVal(i) {
    const val = date + (i) + 1 - day;
    if (val <= 0) {
        return prevMonth + val;
    } else if (val > days[month]) {
        return val - days[month];
    } else {
        return val;
    }
}

// Boutons next et previous
function updateVal(incrementDay) {
    today.setDate(date + incrementDay);
    year = today.getFullYear();
    month = today.getMonth();
    day = mod(today.getDay() - 1, 7) + 1;
    prevMonth = days[mod(month - 1, 12)];
    date = today.getDate();
}

function updateCalendarHeader() {
    $('#calendar-days-header').remove();
    $('#calendar > :nth-child(1)').after(createDaysHeader());
}

function updateDate() {
    $("#calendar-header > :nth-child(2)").replaceWith(createDate());
}

$('#previous-calendar').on('click', () => {
    updateVal(-7);
    updateDate();
    updateCalendarHeader();
});
$('#next-calendar').on('click', () => {
    updateVal(7);
    updateDate();
    updateCalendarHeader();
});

// MOIS
function createDate() {
    const monthVal = [month];
    if (date - day <= 0) {
        monthVal.push(mod(month - 1, 12));
    }
    if (date + 6 - day > days[month]) {
        monthVal.push(mod(month + 1, 12));
    }

    let text = '';
    if (monthVal.length === 1) {
        text = `${months[monthVal[0]]} ${year}`;
    } else if (monthVal.length === 2) {
        text = `${months[monthVal[1]]} - ${months[monthVal[0]]} ${year}`;
    }

    const h3 = $(`<h3>${text}</h3>`);
    return h3;
}

$("#calendar-header > :nth-child(1)").after(createDate());

// HEADERS
const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];


function createDaysHeader() {
    const header = $('<div id="calendar-days-header" class="bg-transparent d-flex"></div>');
    
    // div invisible pour match la colonne temps
    const div = $('<div></div>').css({
        width: "46px",
        "background-color": $('#calendar-header').css('background-color')
    });
    header.append(div);


    for (let i = 0; i < 7; i++) {
        const val = getVal(i);
        header.append(`<span class="text-center">${dayNames[i]} ${val}</span>`);
    }

    // div invisible pour match le scrollbar
    header.append('<div style="min-width: 16px;"></div>');

    return header;
}
$('#calendar').append(createDaysHeader());

function createCalendarColumns() {
    const container = $('<div id="calendar-columns"></div>');

    const timeCol = $('<div id="time" class="text-center d-flex flex-column flex-grow-0 period"></div>');
    for (let h = 0; h < 24; h++) {
        const hour = h.toString().padStart(2, '0') + ':00';
        timeCol.append(`<span>${hour}</span>`);
    }
    container.append(timeCol);

    const colors = [
        'rgba(255, 0, 0, 0.7)',
        'rgba(255, 127, 0, 0.7)',
        'rgba(255, 255, 0, 0.7)',
        'rgba(0, 255, 0, 0.7)',
        'rgba(0, 0, 255, 0.7)',
        'rgba(75, 0, 130, 0.7)',
        'rgba(139, 0, 255, 0.7)',
    ]

    colors.forEach(color => {
        const col = $(`<div class="d-flex flex-grow-1 period" style="background-color : ${color}"></div>`);
        container.append(col);
    });

    return container;
}

$('#calendar').append(createCalendarColumns());
