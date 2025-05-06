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
	};
	displayReunion = false;
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
