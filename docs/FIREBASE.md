# Firebase: aventura completa

Proyecto: `pokecard-3cc3f`, usando la configuración web de PokeCardCollector. Documento compartido: `mamor26Progress/birthday`. Campos: `found` (IDs abiertos), `updatedAt` (timestamp del servidor) y `version` (1).

## Qué publicar ahora

Las reglas de ocho regalos deben actualizarse a **19** para aceptar todos los capítulos.

1. Abrir Firebase Console y seleccionar `pokecard-3cc3f`.
2. Ir a Firestore Database → Rules.
3. Copiar el contenido completo de [firestore.rules](firestore.rules) y pegarlo en el editor. Incluye las reglas de Pokémon que compartiste (`luis`, `martin` y `luis-ash`) y las de la aventura. Si modificaste otras reglas posteriormente, conservar esos cambios y sustituir solo el bloque `match /mamor26Progress/birthday`.
4. Pulsar **Publicar**.
5. Recargar la aventura. No crear documentos a mano, borrar datos ni reiniciar los regalos existentes.

Ese archivo no se publica automáticamente al ejecutar Angular. No se modificaron reglas remotas desde este workspace.

## Comportamiento

- Los IDs de los primeros ocho regalos se conservan; el progreso previo sigue funcionando.
- Son 19 aperturas: 6 Sol/Luna, 2 océano, 3 jardín, 1 spooky, 3 té, 1 camerino, 2 casita y 1 secreto.
- Las dos tazas son `cup-one` y `cup-two`; el termo es `thermos`.
- `arrayUnion` agrega IDs sin duplicarlos y conserva avances concurrentes.
- La página espera datos confirmados por el servidor antes de mostrar el nombre del regalo o desbloquear el siguiente.
- La colección muestra nombres únicamente de regalos confirmados. Los pendientes son «Sorpresa N».
- Los errores de guardado se muestran junto a la apertura, además del aviso global.
- «Reiniciar aventura» vacía las aperturas para todos los dispositivos, con confirmación.
- Las actividades incompletas y los saludos a la compañera son temporales; pueden repetirse al recargar. Las aperturas se guardan.

Sin cuentas, el documento de la aventura puede leerlo y modificarlo cualquier visitante. Para restringir el acceso hace falta incorporar autenticación. Las reglas de esta aventura no alteran los permisos de Pokémon y no conceden acceso al resto de rutas. Un bloque más amplio existente también puede conceder permisos.

## Generar y verificar

Las reglas se generan desde el catálogo para evitar discrepancias entre IDs y límite:

```powershell
npm.cmd run rules:generate
npm.cmd run test:adventure
npm.cmd run build
```

Los tests usan transporte simulado y no escriben ni reinician regalos reales. Después de publicar las reglas, comprobar una apertura desde el teléfono y su sincronización en otro dispositivo.

Referencias: [arrayUnion y escrituras](https://firebase.google.com/docs/firestore/manage-data/add-data), [escuchas en tiempo real](https://firebase.google.com/docs/firestore/query-data/listen), [configuración web y reglas](https://firebase.google.com/docs/projects/api-keys).
