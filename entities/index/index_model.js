const { getPool } = require('../../config/database/db');

async function getInfo(token) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        const result = await client.query(`
            SELECT u.user_id, u.username, u.email
            FROM token t
            JOIN "user" u ON t.user_id = u.user_id
            WHERE t.token = $1 LIMIT 1`, [token]);
        return result.rowCount > 0 ? result.rows[0] : undefined;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function prefixSearch(user_id, email) {
    const client = await getPool().connect();
    try {
        const user_id_query = user_id + "%";
        const email_query = email + "%";
        const res = await client.query('SELECT * FROM "user" WHERE user_id LIKE $1 OR email LIKE $2', [user_id_query, email_query]);
        return res.rows;
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}

async function createReunion(name, dateTimePairs, participants, user_id, email) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');

        const res = await client.query(
            'INSERT INTO reunion (user_id, name) VALUES ($1, $2) RETURNING id',
            [user_id, name]
        );
        const reunion_id = res.rows[0].id;

        await client.query(
            'INSERT INTO participants (reunion_id, email) VALUES ($1, $2)',
            [reunion_id, email]
        );

        for (const { date, time } of dateTimePairs) {
            await client.query(
                'INSERT INTO proposition_date (reunion_id, date, time) VALUES ($1, $2, $3)',
                [reunion_id, date, time]
            );
        }

        for (const participant of participants) {
            if (participant === email) continue;
            await client.query(
                'INSERT INTO participants (reunion_id, email) VALUES ($1, $2)',
                [reunion_id, participant]
            );
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return -1;
        }
        throw error;
    } finally {
        client.release();
    }
}

async function getReunions(user_id) {
    const client = await getPool().connect();
    try {
        const result = await client.query(`
            SELECT r.id, r.name, r.user_id, pd.date, pd.time
            FROM reunion r
            JOIN participants p ON r.id = p.reunion_id
            JOIN proposition_date pd ON r.id = pd.reunion_id
            WHERE p.email = (SELECT email FROM "user" WHERE user_id = $1)
            ORDER BY pd.date, pd.time
        `, [user_id]);

        // Organiser les données par réunion et dates
        const reunions = result.rows.reduce((acc, row) => {
            const reunion = acc.find(r => r.id === row.id);
            if (reunion) {
                reunion.dates.push({ date: row.date, time: row.time });
            } else {
                acc.push({
                    id: row.id,
                    name: row.name,
                    user_id: row.user_id,
                    dates: [{ date: row.date, time: row.time }]
                });
            }
            return acc;
        }, []);

        return reunions;
    } finally {
        client.release();
    }
}

async function getReponses(reunion_id, user_id) {
    const client = await getPool().connect();
    try {
        const result = await client.query(
            'SELECT TO_CHAR(date, \'DD/MM/YYYY\') AS date, time, response FROM response WHERE reunion_id = $1 AND user_id = $2',
            [reunion_id, user_id]
        );
        return result.rows;
    } finally {
        client.release();
    }
}

function parseDate(frDateStr) {
    const [day, month, year] = frDateStr.split('/');
    return `${year}-${month}-${day}`;
}

async function sendResponse(reunion_id, user_id, date, time, response) {
    const client = await getPool().connect();
    try {
        const res = await client.query('SELECT * FROM response WHERE reunion_id = $1 AND user_id = $2 AND date = $3 AND time = $4', [reunion_id, user_id, parseDate(date), time]);
        if (res.rows.length > 0) {
            await client.query('UPDATE response SET response = $1 WHERE reunion_id = $2 AND user_id = $3 AND date = $4 AND time = $5', [response, reunion_id, user_id, parseDate(date), time]);
            return;
        }
        await client.query('INSERT INTO response (reunion_id, user_id, date, time, response) VALUES ($1, $2, $3, $4, $5)', [reunion_id, user_id, parseDate(date), time, response]);
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}

async function getParticipantsLists(reunion_id) {
    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT email FROM participants WHERE reunion_id = $1', [reunion_id]);
        return result.rows;
    } finally {
        client.release();
    }
}

async function deleteReunion(reunion_id) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM reunion WHERE id = $1', [reunion_id]);
    } finally {
        client.release();
    }
}

async function leaveReunion(reunion_id, user_id) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM participants WHERE reunion_id = $1 AND email = (SELECT email FROM "user" WHERE user_id = $2)', [reunion_id, user_id]);
    } finally {
        client.release();
    }
}

async function getProfileParticipants(email) {
    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT user_id FROM "user" WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return undefined;
        }
        return result.rows[0].user_id;
    } finally {
        client.release();
    }
}

async function removeParticipant(reunion_id, email) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM participants WHERE reunion_id = $1 AND email = $2', [reunion_id, email]);
    } finally {
        client.release();
    }
}

async function addParticipant(reunion_id, email) {
    const client = await getPool().connect();
    try {
        if (await client.query('SELECT * FROM participants WHERE reunion_id = $1 AND email = $2', [reunion_id, email]).rows.length > 0) {
            return -1;
        }
        await client.query('INSERT INTO participants (reunion_id, email) VALUES ($1, $2)', [reunion_id, email]);
        return 0;
    } finally {
        client.release();
    }
}

async function getAllResponses(reunion_id) {
    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT reunion_id, user_id, TO_CHAR(date, \'DD/MM/YYYY\') AS date, time, response FROM response WHERE reunion_id = $1', [reunion_id]);
        return result.rows;
    } finally {
        client.release();
    }
}

module.exports = { 
    getInfo, 
    prefixSearch, 
    createReunion, 
    getReunions, 
    getReponses, 
    sendResponse, 
    getParticipantsLists, 
    deleteReunion, 
    leaveReunion, 
    getProfileParticipants, 
    removeParticipant,
    addParticipant,
    getAllResponses
};
