const Auth = require('./index_model');
const vueList = ['jour', 'semaine', 'mois', 'annee'];

async function getIndex(req, res) {
    let vue = req.query.vue;
    if (!vueList.includes(vue)) {
        vue = "semaine";
    }
    const token = req.session.token;
    const result = await Auth.getInfo(token);
    if (!result) {
        res.render('index', {
            token,
            user_id: undefined,
            user_username: undefined,
            vue,
            reunions: undefined
        });
    } else {
        const reunions = await Auth.getReunions(result.user_id);
        res.render('index', {
            token,
            user_id: result.user_id,
            user_username: result.username,
            vue,
            reunions
        });
    }
}

async function getSearchProfil(req, res) {
    const { word } = req.query;
    const results = await Auth.prefixSearch(word, word);
    res.json(results);
}

async function postCreateReunion(req, res) {
    const { name, dates, times, durees, participants } = req.body;
    const token = req.session.token;

    const participantsArray = [...new Set(
        participants
            .split(',')
            .map(email => email.trim())
            .filter(email => email !== '')
    )];
    
    const datesArray = Array.isArray(dates) ? dates : [dates];
    const timesArray = Array.isArray(times) ? times : [times];
    const dureesArray = Array.isArray(durees) ? durees : [durees];
    // Fusionner les dates et heures
    const dateTimePairs = datesArray.map((date, i) => ({
        date,
        time: timesArray[i] || timesArray[0],
        duree: dureesArray[i] || dureesArray[0]
    }));

    const { user_id, email } = await Auth.getInfo(token);
    const result = await Auth.createReunion(name, dateTimePairs, participantsArray, user_id, email);
    if (result === -1) {
        req.session.error = "Vous avez déjà une réunion à cette date et heure ou avec ce nom.";
    }
    res.redirect('/');
}

async function getGetReponses(req, res) {
    const { reunion_id, user_id } = req.params;
    const result = await Auth.getReponses(reunion_id, user_id);
    res.json(result);
}

async function postSendReponse(req, res) {
    const { reunion_id, user_id, date, time, response } = req.body;
    await Auth.sendResponse(reunion_id, user_id, date, time, response);
    res.redirect('/');
}

async function getParticipantsLists(req, res) {
    const { reunion_id } = req.params;
    const result = await Auth.getParticipantsLists(reunion_id);
    res.json(result);
}

async function postGetEmail(req, res) {
    const { user_id } = req.body;
    const result = await Auth.getEmail(user_id);
    res.json(result);
}

async function postDeleteReunion(req, res) {
    const { reunion_id } = req.body;
    await Auth.deleteReunion(reunion_id);
    res.redirect('/');
}

async function postLeaveReunion(req, res) {
    const { reunion_id } = req.body;
    const token = req.session.token;
    const { user_id } = await Auth.getInfo(token);
    await Auth.leaveReunion(reunion_id, user_id);
    res.redirect('/');
}

async function postProfileParticipants(req, res) {
    const { email } = req.body;
    const result = await Auth.getProfileParticipants(email);
    if (result === undefined) {
        res.sendStatus(404);
    }
    res.json(result);
}

async function postDeleteParticipant(req, res) {
    const { reunion_id, email } = req.body;
    try {
        await Auth.removeParticipant(reunion_id, email);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

async function postAddParticipant(req, res) {
    const { reunion_id } = req.params;
    const { email } = req.body;
    try {
        const result = await Auth.addParticipant(reunion_id, email);
        if (result === -1) {
            res.sendStatus(400);
        } else {
            res.sendStatus(200);
        }
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

async function postGetAllResponses(req, res) {
    const { reunion_id } = req.body;
    const result = await Auth.getAllResponses(reunion_id);
    res.json(result);
}

async function postDeleteSlot(req, res) {
    const { reunion_id, date, time, duration } = req.body;
    try {
        await Auth.deleteSlot(reunion_id, date, time, duration);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

async function postAddSlot(req, res) {
    const { reunion_id, date, time, duration } = req.body;
    try {
        await Auth.addSlot(reunion_id, date, time, duration);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

async function getParticipateReunion(req, res) {
    const { token } = req.params;
    const result = await Auth.participateReunion(token);
    if (result === -1) {
        res.redirect('/');
    } else {
        res.render('index/reunion', { 
            token : undefined,
            result,
            temp_id: token
        });
    }
}

async function postInsertICS(req, res) {
    const { reunion_id, ics } = req.body;
    let id;
    if (req.session.token === undefined) {
        const { email } = req.body;
        const tmp = await Auth.getNoAcc(reunion_id, email);
        id = tmp.token;
    } else {
        const token = req.session.token;
        const { user_id } = await Auth.getInfo(token);
        id = user_id;
    }
    
    const result = await Auth.insertICS(reunion_id, id, ics);
    res.json(result);
}

module.exports = { 
    getIndex, 
    getSearchProfil, 
    postCreateReunion, 
    getGetReponses, 
    postSendReponse, 
    getParticipantsLists, 
    postGetEmail,
    postDeleteReunion, 
    postLeaveReunion, 
    postProfileParticipants,
    postDeleteParticipant,
    postAddParticipant,
    postGetAllResponses,
    postDeleteSlot,
    postAddSlot,
    getParticipateReunion,
    postInsertICS
}; 