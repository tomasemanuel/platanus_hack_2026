# Pampa Blaster

Shooter vertical estilo arcade hecho con [Phaser 3](https://phaser.io/). Manejás una nave triangular sobre la pampa y tenés que aguantar oleadas de invasores cada vez más rápidas.

## Cómo jugar

| Acción       | Tecla                 |
| ------------ | --------------------- |
| Mover        | `←` `→` o `A` `D`     |
| Disparar     | `ESPACIO`             |
| Empezar      | `ENTER` / `ESPACIO`   |

- Cada ola trae más enemigos y más velocidad.
- Los enemigos amarillos aguantan dos tiros y devuelven fuego.
- Si un enemigo cruza el borde inferior perdés una vida.
- Tenés 3 vidas.

## Cómo correrlo localmente

No requiere build — Phaser se carga por CDN.

```bash
# con cualquier servidor estático, por ejemplo:
npx serve .
# o
python3 -m http.server 8000
```

Después abrí `http://localhost:3000` (o el puerto que indique tu server) en el browser.

## Stack

- Phaser 3.87.0
- JavaScript vanilla (sin imports/requires)
- Gráficos procedurales (formas geométricas)
- Sonido sintetizado con Web Audio API

## Estructura

```
.
├── game.js          # Lógica completa del juego
├── index.html       # Punto de entrada
├── metadata.json    # Info del juego
├── package.json     # Metadata del proyecto
└── README.md
```
