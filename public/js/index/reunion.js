document.addEventListener("DOMContentLoaded", () => {
    listDateTime(reunion_id, temp_id);
    listParticipant()
    profilParticipant();
    insertICS(reunion_id);
});

function listDateTime(reunion_id, temp_id) {
    const container = document.getElementById("list-proposition");
    const parsedSlots = JSON.parse(slots);
    const parsedResponses = typeof responses === "string" ? JSON.parse(responses) : responses;

    if (!Array.isArray(parsedSlots)) {
        container.innerHTML = "<p>Aucune proposition.</p>";
        return;
    }

    container.innerHTML = parsedSlots.map(slot => {
        const date = formatDateTime(slot.date);
        const time = slot.time;
        const end_time = slot.end_time;

        const slotResponses = parsedResponses.filter(r =>
            r.date === date && r.time === time
        );

        const non = slotResponses.filter(r => r.response === false || r.response === "false").length;
        const oui = slotResponses.filter(r => r.response === true || r.response === "true").length;
        const empty = slotResponses.filter(r => r.response === null).length;
        const total = slotResponses.length - empty;

        const userResponse = slotResponses.find(r => r.user_id === temp_id)?.response;

        return `
            <div class="slot" data-date="${date}" data-time="${time}" data-end-time="${end_time}" data-response="${userResponse}">
                ${date} à ${time} jusqu'à ${end_time}
                <div class="choice">
                    <button class="yes ${userResponse === true ? 'selected-yes' : ''}">Oui</button>
                    <button class="no ${userResponse === false ? 'selected-no' : ''}">Non</button>
                </div>
                <div class="responses">
                    <small>✅ : ${oui} / ❌ : ${non} / 👥 : ${total}</small>
                </div>
            </div>`;
    }).join('');

    document.querySelectorAll('.slot').forEach(slot => {
        const yesBtn = slot.querySelector('.yes');
        const noBtn = slot.querySelector('.no');

        yesBtn.addEventListener('click', () => handleResponseChangeReunion(reunion_id, temp_id, slot, yesBtn, noBtn, true));
        noBtn.addEventListener('click', () => handleResponseChangeReunion(reunion_id, temp_id, slot, yesBtn, noBtn, false));
    });
}

async function handleResponseChangeReunion(reunion_id, temp_id, slot, yesBtn, noBtn, value) {
    const currentResponse = slot.dataset.response === "true" ? true :
                            slot.dataset.response === "false" ? false :
                            null;

    const newResponse = currentResponse === value ? null : value;
    slot.dataset.response = newResponse;

    yesBtn.classList.remove('bg-green');
    noBtn.classList.remove('bg-red');

    if (newResponse === true) {
        yesBtn.classList.add('bg-green');
    } else if (newResponse === false) {
        noBtn.classList.add('bg-red');
    }

    await sendResponseReunion(reunion_id, temp_id, slot.dataset.date, slot.dataset.time, newResponse);
}

async function sendResponseReunion(reunion_id, temp_id, date, time, response) {
    try {
        await fetch('/reponse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reunion_id, user_id: temp_id, date, time, response })
        });
        window.location.reload();
    } catch (err) {
        console.error("Erreur lors de l'envoi de la réponse :", err);
        alert("Une erreur est survenue lors de l'enregistrement.");
    }
}

function listParticipant() {
    const container = document.getElementById("list-participants");
    const parsedParticipants = JSON.parse(participants); 

    if (Array.isArray(parsedParticipants)) {
        container.innerHTML = parsedParticipants
            .map(p => `
                <div class="participant-email">
                    <img src="${p.profilepicture}" alt="Photo de profil" class="profile-pic" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;" />
                    <p>${p.email}</p>
                    ${email === p.email ? '' : '<button class="look-participant">Profil</button>'}
                </div>`)
            .join('');
    } else {
        container.innerHTML = "<p>Aucun participant.</p>";
    }
}

function profilParticipant() {
    const participantElements = document.querySelectorAll('.look-participant');

    participantElements.forEach((element) => {
        element.addEventListener('click', async function () {
            const email = element.parentElement.querySelector('p').textContent.trim();

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

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
                        body: JSON.stringify({ reunion_id: reunionId, ics: icsText, email })
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
