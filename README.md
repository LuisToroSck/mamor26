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

## GitHub

El repositorio local usa `main`. La publicación en GitHub Pages sigue pendiente; no hay workflow de despliegue en esta entrega. Crear un repositorio vacío y conectar su URL:

```powershell
git remote add origin https://github.com/TU-USUARIO/mamor26.git
git push -u origin main
```

Subir código no publica automáticamente la web. Para Pages se debe configurar el build y el base href del nombre final del repositorio.
