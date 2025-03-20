.PHONY: all

all:
	@npm ci .
	@echo "Modules du serveur initialisés !"
	@echo "- 'npm list' pour voir les modules utilisés."
	@echo "- 'node server.js' pour lancer le serveur. (10s~)"
