# programmation-web

## Manuel d'utilisation

### Configuration Base de données PostGreSQL

Créer un fichier `.env` contenant :

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=planify
DB_PASSWORD=password
DB_PORT=5432
```

- DB_USER peut être un autre utilisateur s'il
- DB_NAME peut avoir un autre nom
- DB_PASSWORD doit être le mot de passe de DB_USER choisi

### Build des modules de l'application

Lancez `npm ci .` dans `.../programmation-web`.

### Lancement du serveur

Lancez le serveur avec `node app.js`.

### Modules utilisés

`npm list` pour voir les modules utilisés.

## Membres
|  Nom  | Prénom | N° étudiant |
| :---: | :----: | :---------: |
| CHIV  | Henri  |  22205265   |
| CHEN  | Michel |  22202655   |