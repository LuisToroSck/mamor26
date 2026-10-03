# mamor26 · Tu pequeño universo

Aventura de cumpleaños para celular en un único frontend Angular, con progreso compartido en Firebase.

## Ejecutar

```powershell
npm.cmd install
npm.cmd start
```

Abrir http://localhost:4200. Node.js 22.13 o compatible con Angular 19. `.cmd` evita el bloqueo de scripts PowerShell sin cambiar la política del equipo.

```powershell
npm.cmd run test:adventure
npm.cmd run build
```

El sitio compilado queda en `dist/mamor26/browser`.

## Experiencia completa

Sol/Luna, océano, jardín, spooky, pausa del té, camerino, casita y compañera secreta. **19 aperturas**, incluyendo **dos tazas y un termo** por separado. Colección sin spoilers y carta final.

Ella termina una dinámica, tú le entregas el regalo y lo abre. **El nombre aparece solo después de confirmar la apertura y el guardado. No hacen falta marcas en los paquetes.**

- [Idea consolidada](docs/IDEA-CONSOLIDADA.md).
- [Guía de entrega de los 19 regalos](docs/GUIA-ENTREGA.md).
- [Firebase: publicar las reglas completas](docs/FIREBASE.md).

El catálogo y la carta se personalizan en `src/app/adventure.data.ts`. Los IDs de los regalos ya guardados se conservan. «Reiniciar aventura» borra el progreso compartido, previa confirmación.

## Firebase

Antes de guardar los regalos nuevos, publicar en Firebase Console las reglas de [docs/firestore.rules](docs/firestore.rules). Incluyen el límite de 19, todos los IDs y las reglas de Pokémon que compartiste. Se generan desde el catálogo con `npm.cmd run rules:generate`; ese comando no las publica.

## GitHub Pages

El remoto ya es `https://github.com/LuisToroSck/mamor26.git`. El workflow `.github/workflows/deploy-pages.yml` prueba y compila la aventura, y publica `dist/mamor26/browser` al hacer push a `main`. Usa `--base-href /mamor26/`.

1. En el repositorio de GitHub: Settings → Pages → Build and deployment → Source → **GitHub Actions**.
2. Subir la configuración:

```powershell
git add .github/workflows/deploy-pages.yml README.md
git commit -m "Configurar GitHub Pages"
git push origin main
```

3. Revisar la pestaña Actions hasta que termine «Deploy Angular to GitHub Pages».
4. Abrir https://luistorosck.github.io/mamor26/.

Cada nuevo push a main actualiza la web. También se puede ejecutar desde Actions → Run workflow. El workflow no publica las reglas de Firebase: se gestionan en su consola.
