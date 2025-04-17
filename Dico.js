function Dico() {
    const pg = require('pg');
    const pool = new pg.Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'dictionary',
        password: '2004',
        port: 5432
    })
    let client;

    this.connect = async function () {
        client = await pool.connect();
    }

    this.search = async function (word) {
        this.connect();
        const res = await pool.query("SELECT * FROM words WHERE word = $1", [word]);
        return res.rows.length > 0;
    }

    this.insert = async function (word) {
        if (await this.search(word)) {
            return false;
        }
        this.connect();
        await client.query("INSERT INTO words VALUES ($1)", [word]);
        return true;
    }

    this.words = async function () {
        this.connect();
        let res = await client.query("SELECT * FROM words");
        return res.rows;
    }

    this.prefixSearch = async function (query) {
        this.connect();
        let res = await client.query("SELECT * FROM words WHERE word LIKE $1", [query + "%"]);
        return res.rows;
    }
}

module.exports = new Dico();