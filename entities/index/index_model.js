const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');
const mail = require('../../services/mailer/mailer');

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

            const noAcc = await client.query('SELECT * FROM "user" WHERE email = $1', [participant]);
            if (noAcc.rows.length === 0) {
                const token = encrypt.generateToken();

                const result = await client.query('SELECT * FROM no_account WHERE reunion_id = $1 AND email = $2', [reunion_id, participant]);
                if (result.rows.length > 0) {
                    await client.query('UPDATE no_account SET token = $1 WHERE reunion_id = $2 AND email = $3', [token, reunion_id, participant]);
                    continue;
                }

                await client.query(
                    'INSERT INTO no_account (reunion_id, profilepicture, email, token) VALUES ($1, $2, $3, $4)',
                    [reunion_id, "/images/profile/default.png", participant, token]
                );

                await mail.transporter.sendMail({
                    from: 'programmationwebprojet@gmail.com',
                    to: participant,
                    subject: 'Invitation à une réunion',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h2>Bonjour ${participant},</h2>
                            <p>L'utilisateur <strong>${user_id}</strong> vous a invité à participer à la réunion <strong>${name}</strong>.</p>
                            <p>Vous pouvez consulter les créneaux proposés et y répondre en cliquant sur le lien ci-dessous. Aucun compte n'est requis pour répondre :</p>
                            <p>
                                <a href="http://localhost:8080/reunion/${token}" style="color: #1a73e8; text-decoration: none;">
                                    👉 Accéder à la réunion
                                </a>
                            </p>
                            <p>Merci,</p>
                            <p>L'équipe Planify</p>
                            <img src="https://i.imgur.com/NLYAF2v.png" alt="Logo du site" style="width: 200px; height: 50px;"/>
                        </div>
                    `
                });
            }
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
        const result = await client.query(
            `SELECT p.email, u.profilepicture
             FROM participants p
             LEFT JOIN "user" u ON p.email = u.email
             WHERE p.reunion_id = $1`,
            [reunion_id]
        );

        return result.rows;
    } finally {
        client.release();
    }
}

async function getEmail(user_id) {
    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT email FROM "user" WHERE user_id = $1', [user_id]);
        return result.rows[0].email;
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
        await client.query('DELETE FROM response WHERE reunion_id = $1 AND user_id = $2', [reunion_id, user_id]);
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
        const res = await client.query('SELECT * FROM "user" WHERE email = $1', [email]);
        if (res.rows.length === 0) {
            await client.query('DELETE FROM no_account WHERE reunion_id = $1 AND email = $2', [reunion_id, email]);
            await client.query('DELETE FROM participants WHERE reunion_id = $1 AND email = $2', [reunion_id, email]);
            return;
        }
        await client.query('DELETE FROM response WHERE reunion_id = $1 AND user_id = $2', [reunion_id, res.rows[0].user_id]);
        await client.query('DELETE FROM participants WHERE reunion_id = $1 AND email = $2', [reunion_id, email]);
    } finally {
        client.release();
    }
}

async function addParticipant(reunion_id, email) {
    const client = await getPool().connect();
    try {
        // Check si email est déjà dans la reunion
        let res = await client.query('SELECT * FROM participants WHERE reunion_id = $1 AND email = $2', [reunion_id, email]);
        if (res.rows.length > 0) {
            return -1;
        }

        // Check si email sans compte est déjà dans la reunion
        res = await client.query('SELECT * FROM no_account WHERE reunion_id = $1 AND email = $2', [reunion_id, email]);
        if (res.rows.length > 0) {
            return -1;
        }

        // Ajout de email
        await client.query('INSERT INTO participants (reunion_id, email) VALUES ($1, $2)', [reunion_id, email]);
        // Check si l'email appartient a un compte
        const noAcc = await client.query('SELECT * FROM "user" WHERE email = $1', [email]);
        if (noAcc.rows.length === 0) {
            // Token comme un user_id
            const token = encrypt.generateToken();

            const reunion = await client.query('SELECT * FROM reunion WHERE id = $1', [reunion_id]);
            const name = reunion.rows[0].name;
            const orga = reunion.rows[0].user_id;
            
            await mail.transporter.sendMail({
                from: 'programmationwebprojet@gmail.com',
                to: email,
                subject: 'Invitation à une réunion',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2>Bonjour ${email},</h2>
                        <p>L'utilisateur <strong>${orga}</strong> vous a invité à participer à la réunion intitulée <strong>${name}</strong>.</p>
                        <p>Vous pouvez consulter les créneaux proposés et y répondre en cliquant sur le lien ci-dessous. Aucun compte n'est requis pour répondre :</p>
                        <p>
                            <a href="http://localhost:8080/reunion/${token}" style="color: #1a73e8; text-decoration: none;">
                                👉 Accéder à la réunion
                            </a>
                        </p>
                        <p>Merci,</p>
                        <p>L'équipe Planify</p>
                        <img src="https://i.imgur.com/NLYAF2v.png" alt="Logo du site" style="width: 200px; height: 50px;"/>
                    </div>
                `
            });

        }
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

async function deleteSlot(reunion_id, date, time) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM proposition_date WHERE reunion_id = $1 AND date = $2 AND time = $3', [reunion_id, parseDate(date), time]);

        const res = await client.query('SELECT * FROM proposition_date WHERE reunion_id = $1', [reunion_id]);
        if (res.rows.length === 0) {
            await client.query('DELETE FROM reunion WHERE id = $1', [reunion_id]);
        }
    } finally {
        client.release();
    }
}

async function addSlot(reunion_id, date, time) {
    const client = await getPool().connect();
    try {
        await client.query('INSERT INTO proposition_date (reunion_id, date, time) VALUES ($1, $2, $3)', [reunion_id, parseDate(date), time]);
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}

async function participateReunion(token) {
    const client = await getPool().connect();
    try {
        const noAcc = await client.query('SELECT * FROM no_account WHERE token = $1', [token]);
        if (noAcc.rows.length === 0) {
            return -1;
        } 
        const reunion_id = noAcc.rows[0].reunion_id;

        const reu = await client.query('SELECT * FROM reunion WHERE id = $1', [reunion_id]);
        if (reu.rows.length === 0) {
            return -1;
        }

        const prop = await client.query(`
            SELECT pd.date, pd.time, r.response
            FROM proposition_date pd
            LEFT JOIN response r
            ON pd.reunion_id = r.reunion_id
            AND pd.date = r.date
            AND pd.time = r.time
            AND r.user_id = $2
            WHERE pd.reunion_id = $1
            ORDER BY pd.date, pd.time
        `, [reunion_id, token]);

        const parti = await client.query(
            `SELECT 
                participants.email, 
                "user".profilepicture
            FROM participants 
            RIGHT JOIN "user" ON participants.email = "user".email
            WHERE reunion_id = $1

            UNION

            SELECT 
                no_account.email,
                profilepicture
            FROM no_account
            WHERE reunion_id = $1`, 
            [reunion_id]
        );

        const rep = await client.query('SELECT reunion_id, user_id, TO_CHAR(date, \'DD/MM/YYYY\') AS date, time, response FROM response WHERE reunion_id = $1', [reunion_id]);
        const info = {
            reunion_id: noAcc.rows[0].reunion_id,
            email: noAcc.rows[0].email,
            name: reu.rows[0].name,
            user_id: reu.rows[0].user_id,
            dateTime: prop.rows,
            participants: parti.rows,
            responses: rep.rows
        };
        return info;
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
    getEmail,
    deleteReunion, 
    leaveReunion, 
    getProfileParticipants, 
    removeParticipant,
    addParticipant,
    getAllResponses,
    deleteSlot,
    addSlot,
    participateReunion
};
