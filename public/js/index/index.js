const vues = ["jour", "semaine", "mois", "annee"];
const params = new URLSearchParams(document.location.search);
const vue = params.get("vue");
if (vue == null || !vues.includes(vue)) {
    params.append("vue", "semaine");
    window.location.search = params.toString();
}
$('#vue-dropdown').append(vue).css('text-transform','capitalize');
vues.forEach(element => {
    if (element !== vue) {
        $('#vue-dropdown-menu').append(
            `<li><a class="dropdown-item" href="?vue=${element}">${element}</a></li>`).css('text-transform','capitalize');
    }
});

const today = new Date();
const year = today.getFullYear();

function estBissextile(annee) {
    return (annee % 4 === 0 && annee % 100 !== 0) || (annee % 400 === 0);
}

function joursFevrier() {
    return estBissextile(year) ? 29 : 28;
}

const days = [31, joursFevrier(), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function mod(n, m) {
    return ((n % m) + m) % m;
}

function createButton(className, value) {
    return `<button class='btn ${className}'>${value}</button>`;
}

function createPrevButton(value) {
    return createButton('prev-calendar', value);
}

function createCurrButton(value) {
    return createButton('curr-calendar', value);
}

function createNextButton(value) {
    return createButton('next-calendar', value);
}

const overlay = document.getElementById("overlay");
const createBtn = document.getElementById("create-reunion");
const closeBtn = document.getElementById("close-overlay");
let displayReunion = false;

function showOverlay() {
	overlay.style.display = "flex";
	overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
		duration: 200,
		fill: "forwards"
	});
	displayReunion = true;
}

function hideOverlay() {
	const anim = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
		duration: 200,
		fill: "forwards"
	});
	anim.onfinish = () => {
		overlay.style.display = "none";
        resetForm();
	};
	displayReunion = false;
}

function resetForm() {
    const form = document.getElementById('form-reunion');
    form.reset();
    const datetimeGroups = document.querySelectorAll('.datetime-group');
    datetimeGroups.forEach(group => group.remove());

    const group = document.createElement('div');
    group.className = 'datetime-group';
    group.innerHTML = `
        <input type="date" class="form-control mb-2" name="dates[]" required>
        <input type="time" class="form-control mb-2" name="times[]" required>
    `;
    document.getElementById('dates-container').appendChild(group);
}

createBtn.addEventListener("click", (event) => {
	event.stopPropagation();
	if (!displayReunion) {
		showOverlay();
	} else {
		hideOverlay();
	}
});

closeBtn.addEventListener("click", (event) => {
	event.stopPropagation();
	hideOverlay();
});

document.addEventListener("click", (event) => {
	if (!displayReunion) return;
	if (!overlay.contains(event.target)) {
		hideOverlay();
	}
});

overlay.addEventListener("click", (event) => {
	event.stopPropagation();
});

const addButton = document.getElementById('add-datetime');
const container = document.getElementById('dates-container');
addButton.addEventListener('click', () => {
    const group = document.createElement('div');
    group.className = 'datetime-group';
    group.innerHTML = `
        <input type="date" class="form-control mb-2" name="dates[]" required>
        <input type="time" class="form-control mb-2" name="times[]" required>
        <button type="button" class="btn btn-danger btn-sm remove-datetime">Supprimer</button>
    `;
    container.appendChild(group);
    
    const removeButton = group.querySelector('.remove-datetime');
    removeButton.addEventListener('click', () => {
        group.remove();
    });
});

const reunionButtons = document.querySelectorAll('.reunion-button');
reunionButtons.forEach(button => {
	button.addEventListener('click', function() {
		const reunionId = this.getAttribute('data-id');
		const reunionName = this.getAttribute('data-name');
		const userId = this.getAttribute('data-user_id');
		const slots = JSON.parse(this.getAttribute('data-slots')); 
		
		showReunionInfo(reunionId, reunionName, userId, slots);
	});
});

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

async function showReunionInfo(reunionId, reunionName, userId, slots) {
    const infoDiv = document.getElementById('info-reunion');

    let responses = {};
    try {
        const res = await fetch(`/reponse/${reunionId}/${userId}`);
        const data = await res.json();
        for (const r of data) {
			const date = new Date(r.date).toISOString().split('T')[0]; 
			responses[`${date}_${r.time}`] = r.response;
		}		
    } catch (err) {
        console.error('Erreur chargement réponses :', err);
    }

    let slotsHtml = `
        <button class="close-button" onclick="resetReunionInfo()">&times;</button>
        <div id="reunion-name">Réunion : ${reunionName}<br>(Créer par : ${userId})</div>
        <div id="reunion-slots">`;

    if (slots && slots.length > 0) {
        slots.forEach(slot => {
            const formattedDate = formatDateTime(slot.date);
            const date = new Date(slot.date).toISOString().split('T')[0];
			const key = `${date}_${slot.time}`;
            const response = responses[key];

            const yesClass = response === true ? 'selected-yes' : '';
            const noClass = response === false ? 'selected-no' : '';

            slotsHtml += `
				<div class="slot" data-date="${slot.date}" data-time="${slot.time}" data-response="${response}">
					<div>${formattedDate} à ${slot.time}</div>
					<div class="choice">
						<button class="yes ${yesClass}">Oui</button>
						<button class="no ${noClass}">Non</button>
					</div>
				</div>
			`;
        });
    } else {
        slotsHtml += `Aucun créneau proposé.`;
    }

    slotsHtml += '</div>';
    infoDiv.innerHTML = slotsHtml;


    const slotDivs = document.querySelectorAll('.slot');
    slotDivs.forEach(slotDiv => {
        const yesBtn = slotDiv.querySelector('.yes');
        const noBtn = slotDiv.querySelector('.no');

        yesBtn.addEventListener('click', async () => {
            const current = slotDiv.getAttribute('data-response');
            let response = null;

            if (current === 'true') {
                slotDiv.setAttribute('data-response', 'null');
                yesBtn.classList.remove('selected-yes');
                response = null;
            } else {
                slotDiv.setAttribute('data-response', 'true');
                yesBtn.classList.add('selected-yes');
                noBtn.classList.remove('selected-no');
                response = true;
            }

            await sendResponse(reunionId, userId, slotDiv.dataset.date, slotDiv.dataset.time, response);
        });

        noBtn.addEventListener('click', async () => {
            const current = slotDiv.getAttribute('data-response');
            let response = null;

            if (current === 'false') {
                slotDiv.setAttribute('data-response', 'null');
                noBtn.classList.remove('selected-no');
                response = null;
            } else {
                slotDiv.setAttribute('data-response', 'false');
                noBtn.classList.add('selected-no');
                yesBtn.classList.remove('selected-yes');
                response = false;
            }
            await sendResponse(reunionId, userId, slotDiv.dataset.date, slotDiv.dataset.time, response);
        });
    });
}

// Envoi de la réponse au serveur
async function sendResponse(reunionId, userId, date, time, response) {
    try {
        await fetch('/reponse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reunion_id: reunionId,
                user_id: userId,
				date: date,
				time: time,
                response
            })
        });
    } catch (err) {
        console.error('Erreur lors de l\'envoi de la réponse :', err);
        alert("Une erreur est survenue lors de l'enregistrement.");
    }
}

function resetReunionInfo() {
    const infoDiv = document.getElementById('info-reunion');
    infoDiv.innerHTML = 'Aucune réunion choisie.';
}