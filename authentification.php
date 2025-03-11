<!DOCTYPE html>
<html lang="fr">
	<head>
		<meta charset="UTF-8"/>
		<title>Connexion - Planify</title>
        <link href="css/app.css" rel="stylesheet"/>
		<link href="css/connexion.css" rel="stylesheet"/>
	</head>
	<body>
		<form action="planning.html" method="post">
            <div>
                <label for="connexion">Adresse e-mail/Pseudo :</label>
                <input type="text" name="connexion" id="connexion" required/>
            </div>
            <div>
                <label for="mdp">Mot de passe :</label>
                <input type="password" name="mdp" id="mdp" required/>
            </div>
            <div>
                <input type="submit" value="Se connecter">
            </div>    
        </form>
	</body>
</html>