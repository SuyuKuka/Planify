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

// Overlay
const overlay = document.getElementById("overlay");
const overlayReunion = document.getElementById("overlay-reunion");

let displayOverlay = false;
let displayOverlayReunion = false;

function toggleOverlay(show, element, flagSetter, onClose = () => {}) {
    if (show) {
        element.style.display = "flex";
        element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "forwards" });
    } else {
        const anim = element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
        anim.onfinish = () => {
            element.style.display = "none";
            onClose();
        };
    }
    flagSetter(show);
}

function showOverlayReunion() {
    toggleOverlay(true, overlayReunion, show => displayOverlayReunion = show);
}

document.addEventListener("click", e => {
    const target = e.target;

    if (overlay.contains(target) || overlayReunion.contains(target)) return;
    if (target.id === "create-reunion") {
        e.stopPropagation();
        e.preventDefault();
        toggleOverlay(false, overlayReunion, show => displayOverlayReunion = show);
        toggleOverlay(!displayOverlay, overlay, show => displayOverlay = show, resetForm);
        return;
    }

    console.log(target.id);
    if (["reunion-details", "details-button", "details-title"].includes(target.id)) {
        e.stopPropagation();
        e.preventDefault();
        toggleOverlay(false, overlay, show => displayOverlay = show, resetForm);
        showOverlayReunion();
        return;
    }

    if (displayOverlay) {
        toggleOverlay(false, overlay, show => displayOverlay = show, resetForm);
    }
    if (displayOverlayReunion) {
        toggleOverlay(false, overlayReunion, show => displayOverlayReunion = show);
    }
});

[overlay, overlayReunion].forEach(el =>
    el.addEventListener("click", e => e.stopPropagation())
);

$("#close-overlay").on("click", (e) => {
    e.preventDefault();
    toggleOverlay(false, overlay, show => displayOverlay = show, resetForm);
});

$("#close-overlay-reunion").on("click", (e) => {
    e.preventDefault();
    toggleOverlay(false, overlayReunion, show => displayOverlayReunion = show);
});

// Formulaire date/heure
const container = document.getElementById('dates-container');
document.getElementById('add-datetime').addEventListener('click', () => {
    const group = document.createElement('div');
    group.className = 'datetime-group';
    group.innerHTML = `
        <input type="date" class="form-control mb-2" name="dates[]" required>
        <input type="time" class="form-control mb-2" name="times[]" required>
        <button type="button" class="btn btn-danger btn-sm remove-datetime">Supprimer</button>`;
    container.appendChild(group);
    group.querySelector('.remove-datetime').addEventListener('click', () => group.remove());
});

function resetForm() {
    document.getElementById('form-reunion').reset();
    container.innerHTML = '';
    const group = document.createElement('div');
    group.className = 'datetime-group';
    group.innerHTML = `
        <input type="date" class="form-control mb-2" name="dates[]" required>
        <input type="time" class="form-control mb-2" name="times[]" required>`;
    container.appendChild(group);
}

// Réunions
document.querySelectorAll('.reunion-button').forEach(button => {
    button.addEventListener('click', () => {
        reunionUserId = button.dataset.user_id
        showReunionInfo(
            button.dataset.id,
            button.dataset.name,
            currentUserId,
            reunionUserId,
            JSON.parse(button.dataset.slots)
        );

        if (reunionUserId === currentUserId) {
            document.getElementById("edit-reunion").style.display = "inline-block";
            document.getElementById("delete-reunion").style.display = "inline-block";
            document.getElementById("leave-reunion").style.display = "none";
        } else {
            document.getElementById("edit-reunion").style.display = "none";
            document.getElementById("delete-reunion").style.display = "none";
            document.getElementById("leave-reunion").style.display = "inline-block";
        }
    });
});

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

async function showReunionInfo(reunionId, reunionName, userId, userIdOrga, slots) {
    const infoDiv = document.getElementById('right');
    infoDiv.innerHTML = '';

    let responses = {};
    try {
        const res = await fetch(`/reponse/${reunionId}/${userId}`);
        const data = await res.json();
        for (const { date, time, response } of data) {
            responses[`${new Date(date).toISOString().split('T')[0]}_${time}`] = response;
        }
    } catch (err) {
        console.error('Erreur chargement réponses :', err);
    }

    let slotsHtml = `
        <div id="top-info">
            <div id="reunion-details">
                <label id="details-button">&larr;</label>
                <label id="details-title" style="text-decoration: underline;">Détails</label>
            </div>
            <button id="close-button" onclick="resetReunionInfo()">&times;</button>
        </div>
        <div class="info-reunion" id="info-reunion">
        <p>Proposition de la réunion :</p>
        <div id="reunion-name">Réunion : ${reunionName}<br>(Créer par : ${userIdOrga})</div>
        <div id="reunion-slots">`;

    if (slots?.length) {
        slotsHtml += slots.map(slot => {
            const date = new Date(slot.date).toISOString().split('T')[0];
            const key = `${date}_${slot.time}`;
            const res = responses[key];
            return `
                <div class="slot" data-date="${slot.date}" data-time="${slot.time}" data-response="${res}">
                    <div>${formatDateTime(slot.date)} à ${slot.time}</div>
                    <div class="choice">
                        <button class="yes ${res === true ? 'selected-yes' : ''}">Oui</button>
                        <button class="no ${res === false ? 'selected-no' : ''}">Non</button>
                    </div>
                </div>`;
        }).join('');
    } else {
        slotsHtml += `Aucun créneau proposé.`;
    }

    infoDiv.innerHTML = slotsHtml + '</div></div>';

    document.querySelectorAll('.slot').forEach(slot => {
        const yesBtn = slot.querySelector('.yes');
        const noBtn = slot.querySelector('.no');

        yesBtn.addEventListener('click', () => handleResponseChange(slot, yesBtn, noBtn, reunionId, userId, true));
        noBtn.addEventListener('click', () => handleResponseChange(slot, yesBtn, noBtn, reunionId, userId, false));
    });

    try {
        const resPart = await fetch(`/participants/${reunionId}`);
        const participants = await resPart.json();

        const listContainer = document.getElementById("list-participants");
        if (participants.length > 0) {
            listContainer.innerHTML = "<h4>Participants :</h4><ul>" +
            participants.map((p, index) => {
                if (index === 0) {
                    return `<li><label class="participant-email">${p.email}</label></li>`;
                } else {
                    return `<li><label class="participant-email">${p.email}</label>
                            <button class="look-participant">Profil</button>
                            <button class="remove-participant">Enlever</button>
                        </li>`;
                }
            }).join('') +
        "</ul>";
        } else {
            listContainer.innerHTML = "<p>Aucun participant.</p>";
        }
    } catch (err) {
        console.error("Erreur lors de la récupération des participants :", err);
        document.getElementById("list-participants").innerHTML = "<p>Impossible de charger les participants.</p>";
    }

    deleteReunion(reunionId);
    leaveReunion(reunionId, userId);
    profilParticipant();
    deleteParticipant(reunionId, reunionName, userId, userIdOrga, slots);
}

async function handleResponseChange(slot, yesBtn, noBtn, reunionId, userId, value) {
    const current = slot.dataset.response === String(value);
    const newResponse = current ? null : value;
    slot.dataset.response = newResponse;

    yesBtn.classList.toggle('selected-yes', newResponse === true);
    noBtn.classList.toggle('selected-no', newResponse === false);

    await sendResponse(reunionId, userId, slot.dataset.date, slot.dataset.time, newResponse);
}

async function sendResponse(reunionId, userId, date, time, response) {
    try {
        await fetch('/reponse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reunion_id: reunionId, user_id: userId, date, time, response })
        });
    } catch (err) {
        console.error("Erreur lors de l'envoi de la réponse :", err);
        alert("Une erreur est survenue lors de l'enregistrement.");
    }
}

function resetReunionInfo() {
    document.getElementById('right').innerHTML = `
        <p>Proposition de la réunion :</p><br>
        <div class="info-reunion" id="info-reunion">Aucune réunion choisie.</div>`;
}

async function deleteReunion(reunionId) {
    document.getElementById('delete-reunion').addEventListener('click', async (e) => {
        e.preventDefault();
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette réunion ?")) return;
        try {
            window.location.href = `/delete/${reunionId}`;
        } catch (err) {
            console.error(err);
            alert("Erreur réseau.");
        }
    });
}

async function leaveReunion(reunionId, userId) {
    document.getElementById('leave-reunion').addEventListener('click', async (e) => {
        e.preventDefault();
        if (!confirm("Êtes-vous sûr de vouloir quitter cette réunion ?")) return;
        try {
            window.location.href = `/leave/${reunionId}`;
        } catch (err) {
            console.error(err);
            alert("Erreur réseau.");
        }
    });
}

function profilParticipant() {
    document.querySelectorAll('.look-participant').forEach(button => {
        button.addEventListener('click', async function () {
            const email = button.parentElement.querySelector('.participant-email').textContent;
            const confirmed = confirm(`Vous allez voir le profil de ${email} ?`);
            if (!confirmed) return;
            try {
                const res = await fetch(`/profil/${email}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                
                const data = await res.json();
                window.location.href = `user/profil/?id=${data}`;
            } catch (err) {
                alert("L'utilisateur n'existe pas.");
            }
        });
    });
}

function deleteParticipant(reunionId, reunionName, userId, userIdOrga, slots) {
    document.querySelectorAll('.remove-participant').forEach(button => {
        button.addEventListener('click', async function () {
            const email = button.parentElement.querySelector('.participant-email').textContent;
            const confirmed = confirm(`Supprimer le participant ${email} ?`);
            if (!confirmed) return;

            try {
                const res = await fetch(`/remove/${reunionId}/${email}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (res.ok) {
                    alert("Participant supprimé.");
                    showReunionInfo(reunionId, reunionName, userId, userIdOrga, slots);
                } else {
                    alert("Erreur lors de la suppression.");
                }
            } catch (err) {
                alert("Erreur réseau.");
            }
        });
    });
}
