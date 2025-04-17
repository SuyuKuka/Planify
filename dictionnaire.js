const express = require("express");
const server = new express();
const dico = require("./Dico");

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.get("/dictionary", async (req, res) => {
    const words = await dico.words();
    res.json(words);
});

server.get('/dictionary/search', async (req, res) => {
    const { word } = req.query;
    const words = await dico.prefixSearch(word);
    res.json(words);
});

server.post('/dictionary', async (req, res) => {
    const { word } = req.body;
    const exists = await dico.insert(word);
    if (exists) {
        res.json({ success: "Le mot a ete ajoute au dictionnaire" });
    } else {
        res.json({ error: "Le mot est deja dans le dictionnaire" });
    }
});

async function run() {
    await dico.connect();

    await dico.insert("hello");
    await dico.insert("world");
    await dico.insert("hey");
    await dico.insert("help");
    await dico.insert("hell");
    await dico.insert("hema");
    await dico.insert("word");
    await dico.insert("w");

    server.listen(8080, () => {
        console.log("Server running on port 8080...");
    });
}

run();