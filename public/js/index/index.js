// Vue
// Change la valeur get de vue si non reconnu ou non présente en 'semaine'
const vues = ["semaine"];
const params = new URLSearchParams(document.location.search);
const vue = params.get("vue");
if (vue == null || !vues.includes(vue)) {
    params.append("vue", "semaine");
    window.location.search = params.toString();
}
// Ajoute toutes formats de vue du calendrier dans le dropdown
$('#vue-dropdown').append(vue).css('text-transform','capitalize');
vues.forEach(element => {
    const elementClass = element !== vue ? "" : "active";
    $('#vue-dropdown-menu').append(
        `<li><a class="dropdown-item ${elementClass}" href="?vue=${element}">${element}</a></li>`)
        .css('text-transform','capitalize');
});

let today = new Date();
let year = today.getFullYear();

function estBissextile(annee) {
    return (annee % 4 === 0 && annee % 100 !== 0) || (annee % 400 === 0);
}

function joursFevrier() {
    return estBissextile(year) ? 29 : 28;
}

const days = [31, joursFevrier(), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function mod(n, m) {
    return ((n % m) + m) % m;
}

function createTimeDiv() {
    const timeDiv = $('<div id="timeDiv" class="time-column"></div>');
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        timeDiv.append(`<div class="hour-block">${hour}:00</div>`);
    }
    return timeDiv;
}

function createButton(value) {
    return `<button class='btn calendar-day'>${value}</button>`;
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

let reunionIdSelected;
document.addEventListener("click", e => {
    const target = e.target;

    if (overlay.contains(target) || overlayReunion.contains(target)) return;
    if (target.id === "create-reunion" || target.classList.contains("period") && document.getElementById("create-reunion")) {
        toggleOverlay(false, overlayReunion, show => displayOverlayReunion = show);
        toggleOverlay(!displayOverlay, overlay, show => displayOverlay = show, resetForm);
        return;
    }

    if (["reunion-details", "details-button", "details-title"].includes(target.id)) {
        toggleOverlay(false, overlay, show => displayOverlay = show, resetForm);
        showOverlayReunion();
        deleteReunion(reunionIdSelected);
        leaveReunion(reunionIdSelected);
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
    toggleOverlay(false, overlay, show => displayOverlay = show, resetForm);
});

$("#close-overlay-reunion").on("click", (e) => {
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
        <input type="time" class="form-control mb-2" name="end_times[]" required>
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
        <input type="time" class="form-control mb-2" name="times[]" required>
        <input type="time" class="form-control mb-2" name="end_times[]" required>`;
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

        const tmp = document.getElementById("add-participant");
        if (reunionUserId === currentUserId) {
            if (tmp) tmp.style.display = "inline-block";
            document.getElementById("delete-reunion").style.display = "inline-block";
            document.getElementById("leave-reunion").style.display = "none";
        } else {
            if (tmp) tmp.style.display = "none";
            document.getElementById("delete-reunion").style.display = "none";
            document.getElementById("leave-reunion").style.display = "inline-block";
        }
        return button;
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
        for (let { date, time, response } of data) {
            responses[`${date}_${time}`] = response;
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
        <div id="reunion-name">Créer par : ${userIdOrga}</div>
        <div id="reunion-slots">`;

    if (slots?.length) {
        slotsHtml += slots.map(slot => {
            const tmp = new Date(slot.date); 
            const date = formatDateTime(tmp);
            const time = slot.time;
            const end_time = slot.end_time;

            const key = `${date}_${slot.time}`;
            const res = responses[key];
            if (userId === userIdOrga) {
                return `
                    <div class="slot" data-date="${date}" data-time="${time}" data-end-time="${end_time}" data-response="${res}">
                        <div class="remove-slot">
                            &times;
                        </div>
                        <div>${date} à ${time}</div>
                        jusqu'à : ${end_time}
                        <div class="choice" style="display: none;">
                            <button class="yes ${res === true ? 'selected-yes' : ''}">Oui</button>
                            <button class="no ${res === false ? 'selected-no' : ''}">Non</button>
                        </div>
                    </div>
                    `;
            }
            return `
                <div class="slot" data-date="${date}" data-time="${time}" data-end-time="${end_time}" data-response="${res}">
                    <div>${date} à ${time}</div>
                    jusqu'à : ${end_time}
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

    document.querySelectorAll('.slot').forEach(function (slot) {
        const yesBtn = slot.querySelector('.yes');
        const noBtn = slot.querySelector('.no');

        yesBtn.addEventListener('click', function() {
            handleResponseChange(slot, yesBtn, noBtn, reunionId, userId, true)
        });

        noBtn.addEventListener('click', function() {
            handleResponseChange(slot, yesBtn, noBtn, reunionId, userId, false)
        });
    });

    if (userId === userIdOrga) {        
        infoDiv.innerHTML += `<div class="form-group-after" id="dates-container">
                                Dates et heures :
                                <div class="datetime-group-after">
                                    <input type="date" name="dates">
                                    <input type="time" name="times">
                                    <input type="time" name="end_times">
                                </div>
                            </div>
                            <button type="button" id="add-datetime-after" class="btn btn-sm btn-outline-secondary mb-3">
                                + Ajouter une date/heure
                            </button>`
    } else {
        infoDiv.innerHTML += `<div class="form-group-after">
                                Importer un ICS (réponds automatiquement)
                                <input type="file" name="ics" class="form-control" accept=".ics" id="ics-file">
                            </div>
                            <button type="button" id="subtmit-ics" class="btn btn-sm btn-outline-secondary mb-3">
                                Envoyer
                            </button>`
    }

    const userIdEmail = await getUserEmail(userId);
    const userIdOrgaEmail = await getUserEmail(userIdOrga);
    try {
        const resPart = await fetch(`/participants/${reunionId}`);
        const participants = await resPart.json();
        const listContainer = document.getElementById("list-participants");

        document.getElementById("reunion-title").innerHTML = "Information sur la reunion<br>" + reunionName;

        if (participants.length > 0) {
            let html = "" +
            participants.map((p) => {
                if (p.profilepicture === null || p.profilepicture === undefined) {
                    p.profilepicture = "/images/profile/default.png";
                }

                if (p.email === userIdEmail) {
                    return `<div class="list-p">
                                <div class="participant">
                                    <img src="${p.profilepicture}" class="pfp img-fluid mb-3">
                                    <label class="participant-email">${p.email}</label>
                                </div>
                            </div>
                            `;
                } else if (userIdEmail === userIdOrgaEmail) {
                    return `<div class="list-p">
                                <div class="participant">
                                    <img src="${p.profilepicture}" class="pfp img-fluid rounded-circle mb-3">
                                    <label class="participant-email">${p.email}</label>
                                </div>
                                <div class="button-container">
                                    <button class="look-participant">Profil</button>
                                    <button class="remove-participant">Enlever</button>
                                </div>
                            </div>
                            `;
                } else {
                    return `<div class="list-p">
                                <div class="participant">
                                    <img src="${p.profilepicture}" class="pfp img-fluid rounded-circle mb-3">
                                    <label class="participant-email">${p.email}</label>
                                </div>
                                <div class="button-container">
                                    <button class="look-participant">Profil</button>
                                </div>
                            </div>
                            `;
                }
            }).join('') +
            "</ul>";
            listContainer.innerHTML = html;
        } else {
            listContainer.innerHTML = "<p>Aucun participant.</p>";
        }
    } catch (err) {
        console.error("Erreur lors de la récupération des participants :", err);
        document.getElementById("list-participants").innerHTML = "<p>Impossible de charger les participants.</p>";
    }

    if (userId === userIdOrga) {
        const addParticipantBtn = document.getElementById("add-participants");
        if (userIdEmail === userIdOrgaEmail) {
            addParticipantBtn.innerHTML = `
            <div id="overlay-add-participant" class="overlay">
                <div class="form-group">
                    <h4 id="add-participant-title">Ajouter un participant : </h4>
                    <input type="email" id="participant-email" placeholder="exemple@domaine.com" class="form-control">
                    <button id="add-participant" class="btn btn-success">Ajouter</button>
                </div>
            </div>`;
        }
    }

    reunionIdSelected = reunionId;
    showResults(reunionId);
    profilParticipant();
    if(userId === userIdOrga) {
        deleteParticipant(reunionId, reunionName, userId, userIdOrga, slots);
        addParticipant(reunionId, reunionName, userId, userIdOrga, slots);
        removeSlot(reunionId);
        addDateTimeAfter(reunionId);
    } else {
        insertICS(reunionId);
    }
}

async function getUserEmail(userId) {
    try {
        const res = await fetch('/get-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });

        const data = await res.json();
        return data;
    } catch (err) {
        console.error(err);
    }
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
        showResults(reunionId);
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
    const deleteButton = document.getElementById('delete-reunion');
    deleteButton.onclick = async (e) => {
        e.preventDefault();
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette réunion ?")) return;
        try {
            await fetch('/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reunion_id: reunionId })
            });
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Erreur réseau.");
        }
    };
}

function leaveReunion(reunionId) {
    const leaveButton = document.getElementById('leave-reunion');
    leaveButton.onclick = async (e) => {
        e.preventDefault();
        if (!confirm("Êtes-vous sûr de vouloir quitter cette réunion ?")) return;
        try {
            await fetch('/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reunion_id: reunionId })
            });
            window.location.href = "/";
        } catch (err) {
            console.error(err);
            alert("Erreur réseau.");
        }
    };
}

function profilParticipant() {
    const participantElements = document.querySelectorAll('.look-participant');

    participantElements.forEach((element) => {
        element.addEventListener('click', async function () {
            const email = element.closest('.list-p').querySelector('.participant-email').textContent.trim();

            const confirmed = confirm(`Vous allez voir le profil de ${email} ?`);
            if (!confirmed) return;

            try {
                const res = await fetch(`/profil`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (!res.ok) {
                    throw new Error('L\'utilisateur est introuvable (probablement invité par email)');
                }

                const data = await res.json();
                if (data) {
                    window.location.href = `/user/profil/?id=${data}`;
                } else {
                    throw new Error('Profil introuvable');
                }
            } catch (err) {
                alert(`Erreur : ${err.message}`);
            }
        });
    });
}

function deleteParticipant(reunionId, reunionName, userId, userIdOrga, slots) {
    document.querySelectorAll('.remove-participant').forEach(button => {
        button.addEventListener('click', async function () {
            const email = button.closest('.list-p').querySelector('.participant-email').textContent;
            const confirmed = confirm(`Supprimer le participant ${email} ?`);
            if (!confirmed) return;

            try {
                const res = await fetch(`/remove`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reunion_id: reunionId, email })
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

function addParticipant(reunionId, reunionName, userId, userIdOrga, slots) {
    const btn = document.getElementById('add-participant');
    if (!btn) return;

    btn.onclick = async function (e) {
        e.preventDefault();
        const email = document.getElementById('participant-email').value.trim();
        if (!email) {
            alert("Veuillez entrer un email valide.");
            return;
        }

        try {
            const res = await fetch(`/add-participant/${reunionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                alert("Participant ajouté avec succès.");
                window.location.reload();
            } else if (res.status === 400) {
                alert("L'utilisateur est déjà dans la réunion.");
            } else {
                alert("Erreur serveur. Veuillez réessayer plus tard.");
            }
        } catch (err) {
            console.error("Erreur réseau :", err);
            alert("Erreur réseau.");
        }
    };
}

async function showResults(reunionId) {
    const container = document.getElementById("reunion-slots");
    if (!container) return;

    try {
        const res = await fetch('/all-responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reunion_id: reunionId })
        });

        const results = await res.json();
        const slotMap = {};
        results.forEach(({ date, time, response }) => {
            const key = `${date}_${time}`;
            if (!slotMap[key]) {
                slotMap[key] = { oui: 0, non: 0, total: 0 };
            }

            if (response === true) {
                slotMap[key].oui++;
            } else if (response === false) {
                slotMap[key].non++;
            } else {
                slotMap[key].total--;
            }
            slotMap[key].total++;
        });

        container.querySelectorAll(".slot").forEach(slot => {
            const date = slot.dataset.date;
            const time = slot.dataset.time;
            const key = `${date}_${time}`;

            const data = slotMap[key] || { oui: 0, non: 0, total: 0 };
            const resultDiv = document.createElement("div");
            resultDiv.className = "resultats";
            resultDiv.innerHTML = `
                <small>✅ : ${data.oui} / ❌ : ${data.non} / 👥 : ${data.total}</small>
            `;

            const oldResult = slot.querySelector('.resultats');
            if (oldResult) oldResult.remove();

            slot.appendChild(resultDiv);
        });
    } catch (err) {
        console.error("Erreur lors du chargement des résultats :", err);
    }
}

function removeSlot(reunionId) {
    document.querySelectorAll('.remove-slot').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            const slot = e.target.closest('.slot');
            if (slot) {
                const date = slot.getAttribute('data-date');
                const time = slot.getAttribute('data-time');
                const end_time = slot.getAttribute('data-end-time');

                const confirmed = confirm(`Supprimer le créneau ${date} de ${time} à ${end_time} ?`);
                if (!confirmed) return;
                
                const res = await fetch(`/delete-slot`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reunion_id: reunionId, date, time, end_time })
                }).catch(err => console.error('Erreur suppression slot :', err));

                if (res.ok) {
                    window.location.reload();
                }
            }
        });
    });
}

function addDateTimeAfter(reunionId) {
    document.addEventListener("click", async function (e) {
        if (e.target && e.target.id === "add-datetime-after") {
            const groups = document.querySelectorAll('.datetime-group-after');
            for (let group of groups) {
                const dateInput = group.querySelector('input[type="date"]');
                const timeInput = group.querySelector('input[type="time"]');
                const endtimeInput = group.querySelector('input[name="end_time"]');
                const date = dateInput.value;
                const time = timeInput.value;
                const endtime = endtimeInput.value;
                if (dateInput && timeInput && date && time) {
                    const res = await fetch(`/add-slot`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reunion_id: reunionId, date: formatDateTime(date), time, endtime })
                    }).catch(err => console.error('Erreur ajout slot :', err));

                    if (res.ok) {
                        window.location.reload();
                    } else {
                        alert("Une erreur est survenue lors de l'ajout du créneau.");
                    }
                } else {
                    alert("Veuillez choisir une date et une heure.");
                }
            }
        }
    });
}

function insertICS(reunionId) {
    document.addEventListener("click", function (e) {
        if (e.target && e.target.id === "subtmit-ics") {
            const fileInput = document.querySelector('input[name="ics"]');
            const file = fileInput.files[0];

            if (!file) {
                alert("Veuillez sélectionner un fichier .ics.");
                return;
            }

            if (!file.name.endsWith(".ics")) {
                alert("Seuls les fichiers .ics sont autorisés.");
                return;
            }

            const reader = new FileReader();
            reader.onload = async function(event) {
                const icsText = event.target.result;
                try {
                    const res = await fetch(`/insert-ics`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reunion_id: reunionId, ics: icsText })
                    });

                    if (res.ok) {
                        window.location.reload();
                    } else {
                        alert("Une erreur est survenue lors de l'ajout de votre calendrier.");
                    }
                } catch (err) {
                    console.error('Erreur calendrier :', err);
                }
            };
            reader.readAsText(file);
        }
    });
}
