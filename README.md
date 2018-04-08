# series-tiempo-ar-explorador

Front liviano y sencillo para explorar las series de tiempo de la API de datos.gob.ar y conformar URLs de consulta.

## Instalación y Compilación

Hosteado en [GitHub Pages](https://pages.github.com/), activado sobre el branch `master`.

Para levantar un entorno local, hace falta tener instalado [node](https://nodejs.org/es/) y [npm](https://www.npmjs.com/).

Clonar el repositorio, y dentro de la carpeta raíz, instalar las dependencias del archivo `package.json`:

```bash
$ sudo npm install
```

Iniciar el servidor:

```bash
$ gulp server
```

Para modificar el código, usar los archivos del directorio `./build/` y luego compilar con `Gulp`:

```bash
$ gulp app_compile
```

También se puede generar watches con el comando:

```bash
$ gulp app_watches
```

Los archivos compilados se guardan en el directorio `./public/`.

Actualizar los metadatos:

Los metadatos se descargan desde datos.gob.ar ([CSV](http://infra.datos.gob.ar/catalog/modernizacion/dataset/1/distribution/1.2/download/series-tiempo-metadatos.csv)) y se levantan en memoria al cargar el sitio web. Para esto se guarda una copia del CSV en el repositorio en Github.

```bash
$ make update_data
```



## Contacto

Te invitamos a [crearnos un issue](https://github.com/datosgobar/series-tiempo-ar-explorador/issues/new) en caso de que encuentres algún bug o tengas feedback de alguna parte del sitio de `series-tiempo-ar-explorador`.
Para todo lo demás, podés mandarnos tu comentario o consulta a [datos@modernizacion.gob.ar](mailto:datos@modernizacion.gob.ar).

## Licencia

MIT license
