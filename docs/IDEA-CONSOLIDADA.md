# Tu pequeño universo ♡

Aventura de cumpleaños Angular pensada para celular. Siete etapas principales, una compañera secreta, colección y carta final. Progreso compartido en Firestore, sin servidor propio ni cuentas.

## La dinámica definitiva

1. Ella realiza una actividad breve en la página.
2. Al completarla, la página indica que tiene una sorpresa esperando. **No muestra el nombre del regalo.**
3. Tú le entregas el regalo en la mano. No hace falta marcar ningún paquete.
4. Ella lo abre y pulsa «Ya abrí mi regalo».
5. Firebase confirma la apertura. Recién entonces aparecen el nombre y el mensaje cariñoso; se suma el descubrimiento y avanza la escena.
6. Completar una etapa desbloquea la siguiente. La colección mantiene ocultos los nombres pendientes.

Esto se aplica también a Sol y Luna y al océano. Los símbolos son decorativos, no etiquetas necesarias.

## Etapas y catálogo

| Etapa | Aperturas | Regalos |
| --- | ---: | --- |
| 1. El Sol y la Luna | 6 | Espejo; pinche dorado; aros sol/luna; porta cenicero; cosmetiquero; scrunchie Whimsi |
| 2. Bajo el agua | 2 | Pinche de pez; dos anillos de pez juntos |
| 3. El jardín de los bichitos | 3 | Dos scrunchies de bichos juntos; colgante de luna; anillo de espiral |
| 4. La noche spooky | 1 | Aros de calabaza |
| 5. Un descanso | 3 | Primera taza; segunda taza; termo con teteras antiguas |
| 6. El camerino mágico | 1 | Paleta de sombras NYX |
| 7. La casita de Chiikawa | 2 | Peluche Chiikawa; peluche Hachiware |
| Secreto. Una pequeña compañera | 1 | Rana porta incienso de cerámica |
| **Total** | **19** | **21 objetos físicos**, contando un par de aros como un regalo |

Los anillos de pez y los scrunchies de bichos se entregan en pares. Las dos tazas se entregan por separado. La [guía de entrega](GUIA-ENTREGA.md) indica qué debes tener preparado para cada actividad.

## Actividades implementadas

- Sol y Luna: despertar la luna; acercar el sol; conectar estrellas; despejar nubes; encender ventanas; guardar un deseo.
- Océano: seguir a un pez que espera entre toques; buscar dos amigos, con ayuda opcional.
- Jardín: plantar, regar y encontrar habitantes; guiar luciérnagas; hacer girar una espiral.
- Spooky: visitar tres calabazas y conocer a un fantasma adorable.
- Té: conectar vapor; combinar aromas y remover; reunir y guardar calor. Son tres aperturas independientes.
- Camerino: elegir tres colores y pintar el cielo con uno distinto en cada parte.
- Casita: preparar manta, luz y cojín; llamar a la puerta para recibir al segundo visitante.
- Compañera: saludarla tres veces desde que se completa Sol y Luna para entrar al estanque; ayudarla a cruzar tres nenúfares y encender dos luces. No bloquea el recorrido principal. Si no la descubrió antes, aparece al terminar la casita.
- Cierre: tras las 19 aperturas se habilita una carta tranquila y la colección completa.

Todas las actividades tienen botones accesibles mediante teclado, objetivos cortos y movimiento reducido. No hay penalizaciones ni carreras contra el tiempo. El deseo no se escribe ni se envía a Firebase.

## Progreso y límites

El progreso se guarda en `mamor26Progress/birthday`. Los ocho IDs anteriores se conservan. La actualización de las [reglas de Firebase](FIREBASE.md) a 19 aperturas debe publicarse desde la consola para guardar los regalos nuevos. La app no despliega reglas.

Una apertura incompleta puede repetirse al recargar; las aperturas confirmadas permanecen. El progreso se comparte entre dispositivos. Reiniciar lo vacía para todos, previa confirmación.

La web no protege los secretos contra alguien que inspeccione el código: es una sorpresa narrativa. No incluye fotos personales ni música. La publicación en GitHub Pages sigue pendiente.

## Personalización

El catálogo y la carta están en `src/app/adventure.data.ts`. Se pueden ajustar nombre, apodo, mensajes y carta. Como todavía no se indicó el diseño de la segunda taza, se distinguen por su orden de entrega.

Dirección visual: cielo nocturno, dorado y crema, con cambios de color por escena; jardín verde, spooky morado, pausa cálida, camerino lavanda y casita suave.
