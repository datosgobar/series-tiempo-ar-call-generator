# para Mac con Homebrew
setup:
	# instala node
	brew update && brew install node
	brew link --overwrite node
	# chequea instalación de node
	node -v
	npm -v
	# instala dependencias del proyecto
	sudo npm install
	# instala la CLI de gulp para desarrollo
	sudo npm install --global gulp-cli

server:
	gulp server

compile:
	gulp app_compile

watch:
	gulp app_watches

update_data:
	wget -O build/data/series-tiempo-metadatos.csv http://infra.datos.gob.ar/catalog/modernizacion/dataset/1/distribution/1.2/download/series-tiempo-metadatos.csv

doctoc: ## generate table of contents, doctoc command line tool required
        ## https://github.com/thlorenz/doctoc
	doctoc --title "## Indice" README.md
