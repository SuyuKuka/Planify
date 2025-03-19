.PHONY: all

all:
	@if [ ! -d ./node_modules ]; then \
		ln -s ./modules/node_modules ./node_modules; \
	fi
	@echo "modules du serveur initialisés !";
