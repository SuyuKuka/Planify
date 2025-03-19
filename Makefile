.PHONY: all

all:
	@npm ci --prefix ./modules;
	@if [ -d ./node_modules ]; then \
		rm -rf ./node_modules; \
	fi
	@ln -s ./modules/node_modules ./;
	@echo "Modules du serveur initialisés !";

	@echo "- 'npm list' pour voir les modules utilisés."
	@echo "- 'node server.js' pour lancer le serveur. (10s~)"
