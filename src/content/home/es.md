# Aprende un lugar. Recuérdalo. Consérvalo.

GeoTrainer convierte la práctica de Street View en memoria geográfica duradera. Encuentra lugares, ponte a prueba sin pistas y vuelve a los puntos débiles cuando repasarlos resulte más útil.

## Inicio rápido

Empieza con un panorama nuevo. Tus errores crean automáticamente la cola de repaso.

## Recuerdo activo

Un lugar puede parecer familiar; decir dónde está demuestra lo que puedes recuperar. Juego y Repaso exigen una respuesta antes de mostrar la solución, reforzando el recuerdo y revelando la incertidumbre.

## Úsalo o piérdelo

Las pistas geográficas se desvanecen si solo se ven una vez. GeoTrainer conserva cada intento y recupera los lugares difíciles sin repetir todo por igual.

## Repetición espaciada

Un mal intento vuelve antes y una respuesta sólida espera más. La distancia y la puntuación determinan automáticamente cuándo repasar.

## Tu ciclo de entrenamiento

1. Estudia — Explora panoramas desconocidos y aprende qué pistas visibles importan.
2. Juega — Haz una conjetura sin ayuda para medir lo que recuerdas.
3. Repasa — Vuelve a los lugares débiles según su calendario hasta reconocerlos con seguridad.

## Cómo complementa GeoTrainer a GeoGuessr

[GeoGuessr](https://www.geoguessr.com/) destaca en exploración, variedad de mapas, retos individuales, multijugador y competición. GeoTrainer se centra en lo que ocurre entre partidas: convierte encuentros y errores en un plan duradero con estudio sin nota, historial de intentos, repetición espaciada automática, mezclas de países confundibles y pistas guardadas. Usa GeoGuessr para explorar y competir; usa GeoTrainer para entender errores, practicar confusiones y consolidar lo aprendido. Es un complemento, no un sustituto.

## Modo Estudio

En Estudio personalizado y Juego, **Cobertura interior** ofrece Solo exteriores (predeterminado) o Mixto: interiores y exteriores. Google no ofrece una búsqueda fiable de solo interiores; el modo mixto puede mostrar cualquiera de los dos. No cambia los mapas subidos, Meta, Explorar mapa ni Repaso.

Aprender ofrece cuatro opciones: Personalizado, Meta, Explorar mapa y Mapa subido. En Mapa subido, selecciona un JSON de Map Maker con una lista de lugares o `customCoordinates`; cada lugar necesita latitud y longitud válidas. El archivo debe pesar menos de 10 MB. Anterior está antes de Revelar y se activa después de visitar dos lugares. Siguiente avanza por los lugares ya vistos antes de elegir uno nuevo. La X a la derecha de la cabecera abre la elección del modo. El mapa queda en este dispositivo; si continúas en otro, vuelve a subirlo allí. La variación 0 conserva la vista subida; 100 busca Street View hasta 1 km alrededor y vuelve a una ubicación original si hace falta. El botón menos minimiza la ficha del lugar y maximizar la amplía a toda la pantalla.

### Elegir una prioridad de aprendizaje

El aprendizaje con mapa subido etiqueta el progreso de la fuente (por ejemplo, **Fuente: 1/50**). Cada entrada se marca como completada al comprobarla, por lo que **Siguiente** no puede volver a elegirla aunque una variación cercana abra otro panorama; las entradas rotas también se omiten una sola vez. Al terminar, se oculta **Siguiente** y queda **Anterior**. En Juego tampoco se repiten entradas de la fuente. En Explorar mapa puedes buscar una ciudad o un país y elegir una sugerencia del catálogo integrado de GeoTrainer para acercar el mapa. El texto personal del Cuaderno admite hasta 1000 caracteres por guardado y muestra un contador bajo el editor.

La prioridad cambia cómo se eligen las **nuevas ubicaciones de Aprendizaje personalizado** después de aplicar la colección, la mezcla de países, el entorno, la fuente de imágenes y el filtro de interiores. No cambia Mapa subido, Meta, Explorar mapa, Juego ni Repaso.

- **Aleatorio** (predeterminado) toma muestras del conjunto apto sin usar tu historial. Úsalo para obtener variedad o recorrer la colección sin ponderación.
- **Lugares conocidos** elige como punto de partida una ubicación apta que ya encontraste y busca aproximadamente entre 1 y 12 km a su alrededor. Sirve para aprender los alrededores y reconocer vistas cercanas sin repetir el panorama exacto.
- **Menor exposición** elige primero un país apto nunca visto o con menos encuentros, rellena las regiones incluidas que aún aparecen grises en Cobertura y después apunta al mayor hueco geográfico restante. Este paso regional también se aplica a colecciones de un solo país; si una región no tiene un punto local utilizable, se vuelve a la búsqueda de huecos de todo el país.

Si no existe historial apto, Lugares conocidos y Menor exposición empiezan desde el conjunto seleccionado como Aleatorio. En una búsqueda de Menor exposición con varios países, GeoTrainer prueba primero el país gris o menos visitado elegido y su objetivo regional. Cada búsqueda sin un panorama válido, incluso si aparece fuera del país solicitado, avanza de inmediato. Si falla un país nunca visto, se prueban primero los países con cobertura ya comprobada, de menor a mayor exposición, antes de más países desconocidos; los empates se mezclan. El orden se repite hasta encontrar un panorama o hasta que salgas. La cobertura de Street View y los filtros activos siguen determinando si el área objetivo puede ofrecer un panorama, por lo que puede usarse una vista disponible cercana cuando el punto exacto no tiene cobertura.

En Mundo con Menor exposición, un análisis de cobertura incluido omite los países cuyos puntos no encontraron panoramas oficiales navegables. Los conjuntos de países enfocados siguen buscando en todos los países seleccionados.

Estudio es un primer encuentro sin nota. Elige una colección completa, un país objetivo o una mezcla de países que suelas confundir; cada país aparece como una píldora con bandera que puedes quitar. Guardar una pista crea automáticamente una tarjeta reutilizable de Repaso sin inventar una puntuación. La ubicación actual permanece abierta después de guardarla; usa Siguiente cuando quieras avanzar. El estado guardado se recupera al recargar, por lo que la acción no vuelve a aparecer.

Usa los desplegables separados **Regiones** y **Ciudades** y elimina selecciones con sus etiquetas. Las regiones se agrupan por país y las ciudades por región. Sin regiones seleccionadas se usa el país completo. Sin ciudades seleccionadas en una región se incluyen todas las disponibles; elegir ciudades limita solo esa región. Quitar una región elimina sus ciudades; quitar su última ciudad restaura todas las disponibles. Después de añadir países, puedes añadir regiones y ciudades como píldoras independientes. Las regiones aparecen alfabéticamente; las ciudades se ordenan por importancia según la población de forma predeterminada y también pueden ordenarse alfabéticamente. **Todas las ciudades disponibles** usa los puntos de ciudad incluidos para esa región; no representa todo el polígono administrativo ni garantiza cada carretera o zona rural. Al iniciar una nueva configuración de Aprender tras salir de una sesión centrada en países, se restaura World y la lista completa de países; Reanudar conserva la sesión guardada. Menor exposición busca primero en el punto elegido y luego amplía la búsqueda local. En Mixto, los reintentos usan puntos de cobertura del país y mantienen los filtros. La búsqueda sigue intentándolo a un ritmo moderado hasta encontrar una coincidencia o hasta que salgas o cambies la configuración; no se garantiza cobertura en el punto exacto.

## Modo Juego

En la configuración de Juego, elige Lugares generados o Mapa subido. Los turnos del mapa subido usan sus lugares y pueden repetirlos si hay menos lugares que turnos.

Juego usa la misma mezcla de países y mide el recuerdo sin ayuda en 1–100 rondas. Cada respuesta crea un intento nuevo y guarda la vista actual para las previsualizaciones.

## Repaso y programación

Repaso oculta la respuesta hasta tu conjetura. Después de responder, el resultado muestra la ciudad, región, vía, dirección completa y coordenadas disponibles, igual que Revelar en Estudio. Minimiza el resultado desde la esquina superior derecha para estudiar el panorama y usa Ver resultado para abrirlo de nuevo. La práctica personalizada no cambia tarjetas futuras; al completar una tarjeta ya pendiente, su fecha avanza y persiste tras recargar.

## Entrenador de IA y pistas

Juego usa la misma barra de aprendizaje que Estudio: Cuaderno, el contador de notas cercanas disponibles y el entrenador de IA cuando está activado en la configuración de la partida.

Coach espera el idioma de IA guardado antes del análisis, rechaza resultados claramente multilingües y explica las pistas visibles detrás de cada nuevo país candidato.

Analizar reúne automáticamente varias direcciones y vuelve a la vista actual si hace falta. Solo muestra una estimación de región, ciudad o lugar exacto cuando varias pistas visuales sólidas la respaldan. Tras revelar la respuesta, **Analizar** se convierte en **Explicar**: usa solo referencias del país correcto y admite si la imagen no bastaba para identificarlo. Pistas abre una biblioteca con detalle completo, Street View y enlaces a Google Maps; el filtro muestra el total por país, se ordena de mayor a menor y × lo borra.

### Capturar, pegar y analizar una pista

1. Encuadra la pista y pulsa **Impr Pant** o **Windows + Mayús + S** para copiar una captura.
2. Abre **Entrenador de IA → Pistas conocidas**, selecciona el cuadro de pista y pulsa **Ctrl + V** (o **Comando + V** en macOS).
3. Comprueba la vista previa y elige **Analizar pista**.
4. GeoTrainer guarda automáticamente la imagen, las pruebas y la nota de aprendizaje en **Pistas**. Antes de responder en Repaso, el análisis no revela la solución.

Si el recorte tiene un objeto principal claro en primer plano, el entrenador lo analiza primero y usa el entorno como contexto de apoyo o contradicción. Los detalles ilegibles se mantienen explícitamente inciertos.

### Usar una respuesta de IA externa en el Cuaderno

1. Captura o copia la imagen de la pista.
2. Abre Gemini u otra interfaz externa de IA de Google y adjunta o pega la imagen.
3. Empieza con: **«Eres un entrenador de GeoGuessr.»** Pide que explique las pruebas visibles, los principales países que pueden confundirse y la pista que los distinguiría.
4. Copia la respuesta y pégala en el campo de texto del **Cuaderno**.
5. Guarda la nota para Repaso.

El Cuaderno conserva títulos, negrita y listas con viñetas al pegar. Las respuestas externas no se verifican automáticamente: mantén incierto lo ilegible y contrasta cada afirmación con lo realmente visible.

## Colecciones y preferencias

En Configuración → Pantalla → Mapas, **Paleta de colores del mapa** permite Automático, Claro u Oscuro. **Zoom del mapa de resultados** ofrece Más cercano, País, Región del país o Mundo; País es el valor predeterminado. Automático sigue la apariencia de la aplicación; Claro u Oscuro mantienen el color elegido en los mapas de carreteras y relieve. Las imágenes de satélite conservan sus colores. Las fronteras nacionales se muestran por defecto y se pueden ocultar; solo aparecen cuando hay una frontera en el área visible del mapa. El grosor y el color de las fronteras se ajustan con una vista previa en vivo; las fronteras regionales están desactivadas por defecto y se pueden activar por separado.

Los países, ciudades y entornos orientan la generación y no representan una cobertura completa. Las preferencias separan idioma de interfaz, juego e IA, además de límites de repaso, zona horaria, apariencia y ayudas del mapa. Los perfiles nuevos usan 50 tarjetas nuevas y 500 repasos diarios. Efectos y música ambiental son opcionales, empiezan apagados y guardan volúmenes separados.

## Progreso y estadísticas

Los lugares guardados en Estudio son fuentes sin calificar: cuentan como actividad de Estudio y tarjetas nuevas, no como intentos «Sin respuesta» ni puntuaciones cero. Recargar reanuda la visita actual sin crear otra fila.

Consulta lugares, intentos, cola pendiente, rendimiento, historial y tiempo activo en primer plano durante Estudio, Juego activo y Repaso activo, incluido moverte por panoramas y usar ayudas de aprendizaje. El tiempo se guarda al cambiar de sección o volver a Inicio; las sesiones sin visitas ni intentos se ocultan. En una pantalla táctil, mantén pulsada una barra de **Próximos pendientes** para ver la fecha y la cantidad. Pistas conocidas suma entradas personales, de IA y Meta sin duplicar la imagen de una nota. Las rondas con IA se incluyen por defecto y pueden excluirse. El resumen distingue promedio anterior y de hoy; el calendario colorea la actividad. Lugares del mismo país a menos de 50 metros comparten tarjeta.

## Sincronización en la nube

La cuenta es opcional y el entrenamiento local funciona sin iniciar sesión. El progreso de Estudio, Juego y Repaso se guarda primero en este navegador; la sincronización continúa silenciosamente en segundo plano, por lo que una conexión lenta no retrasa el guardado local ni reinicia el espacio de trabajo activo. Al conectarte, se combina el historial de calificaciones de cada dispositivo; prevalecen el ajuste más reciente y la programación calificada más tarde. Al salir se inicia cualquier carga pendiente. Sin iniciar sesión, localhost y el sitio publicado permanecen separados.

## Solución de problemas

1. Panorama vacío — pasa al siguiente; la cobertura de Street View puede cambiar.
2. Controles sobre una pantalla negra — prueba Street View en Google Maps en el mismo navegador. Si también aparece negro, abre GeoTrainer en una ventana privada sin extensiones, cambia la aceleración gráfica del navegador y reinícialo. Actualiza el navegador y el controlador gráfico si hace falta. Si solo falla GeoTrainer, recárgalo una vez e indica el navegador, el dispositivo y las extensiones activas al informar del problema.
3. Repaso vacío — juega o guarda un lugar de Estudio y espera a que venza.
4. IA no disponible — continúa entrenando y prueba más tarde.
5. Progreso antiguo — verifica la cuenta y espera a que termine la sincronización.

## Sugerencias e informes de errores

Envía sugerencias o informes de errores a [mogatas.princealjohn.05082003@gmail.com](mailto:mogatas.princealjohn.05082003@gmail.com). Para un error, incluye el navegador, el dispositivo, lo que estabas haciendo y una captura de pantalla cuando sea posible.

## Preguntas frecuentes

1. ¿Necesito una cuenta? — No, solo para sincronizar.
2. ¿Estudio cambia mi puntuación? — No.
3. ¿Puedo calificar manualmente? — No; decide el resultado geográfico.
4. ¿La práctica extra aplaza tarjetas? — No; las futuras no cambian y las ya pendientes avanzan al completarlas.
5. ¿Cobertura incluye todos los lugares? — No, solo los visitados.

## Recursos de aprendizaje

Combina marcas viales, lado de conducción, alfabetos, postes, relieve, arquitectura, vegetación, cámara y clima. Confía en varias pistas coherentes y anota también las contradicciones.

### Referencias externas

- [Plonk It](https://www.plonkit.net/) — guías estructuradas por países, regiones, mapas y práctica.
- [GeoHints](https://geohints.com/) — catálogo visual de bolardos, líneas, matrículas, señales, postes, cámaras y otras pistas.
- [GeoMetas](https://geometas.com/) — lecciones gratuitas de metas por país, región y categoría, con cuestionarios dinámicos.
- [Learnable Meta](https://learnablemeta.com/) — mapas de aprendizaje de GeoGuessr, documentación y recursos para crear mapas.

## Aprender, Meta y Cuaderno

Las imágenes pegadas, subidas o capturadas en el Cuaderno se pueden recortar antes de analizarlas o guardarlas. Usa el control de edición en la esquina inferior derecha de la vista previa, arrastra el área o sus esquinas y aplica el recorte.

La **cámara de 360°** del espacio de trabajo copia cuatro direcciones del panorama actual como una sola imagen. Una notificación muestra el progreso y confirma si la copia se realizó correctamente. La imagen va directamente al portapapeles y no se guarda en GeoTrainer.

Aprender ofrece tres rutas. **Personalizado** conserva colecciones y entornos. **Meta** abre lecciones guiadas en el panorama y rumbo guardados. **Explorar mapa** muestra la cobertura de Street View. En Meta y el mapa, Revelar abre la tarjeta normal, donde Guardar para repasar programa la práctica de ubicación. El mapa usa Volver al mapa mundial en lugar de Siguiente. Aprender personalizado y Juego usan imágenes oficiales de Google de forma predeterminada; el selector permite mezclar panoramas oficiales y de colaboradores o solicitar solo panoramas de colaboradores. **Permitir interiores** está desactivado de forma predeterminada en ambas configuraciones; al activarlo, Google puede devolver cobertura de Street View tanto interior como exterior. En **Configuración → Pantalla** puedes controlar nombres de calles, fecha de imagen, movimiento del teléfono, forma de desplazarte, tipo de mapa, gestos, lugares interactivos y colores de GeoTrainer. Los nombres de calles y los lugares interactivos vienen desactivados para evitar pistas accidentales.

La bombilla superior derecha abre o cierra la explicación. El aviso inicial puede cerrarse una vez u ocultarse para siempre sin eliminar lecciones. Un Meta entra en **Mis pistas** solo al guardar explícitamente su ubicación para repasar. Durante el repaso, antes de responder solo se muestra la imagen; el texto completo aparece después, y las herramientas de aprendizaje siguen disponibles hasta elegir Siguiente repaso.

El **Cuaderno** guarda cualquier cantidad de notas personales por panorama. La categoría y el texto son opcionales; una entrada vacía también puede guardar el lugar para repasar. También admite imágenes analizadas por Coach. Puedes escribir y guardar una nota nueva durante el repaso; su análisis de imagen no revela la respuesta antes del intento. Las entradas personales, de IA y Meta abren una vista detallada con Street View y una imagen superpuesta cuando existe. En el detalle de una pista visual guardada puedes añadir o editar su nota, guardarla y abrir la imagen a pantalla completa. Las imágenes idénticas solo se combinan cuando la nota o descripción también coincide o está vacía; si el texto útil es distinto, permanecen separadas. **Notas disponibles** muestra un contador y el historial desplazable completo; los nuevos análisis de Coach aparecen allí de inmediato y no vuelven a abrirse como resultado activo tras recargar. Mis pistas permite filtrar **Personales**, **Con ayuda de IA** y **Lecciones Meta** y pagina 20 resultados coincidentes a la vez; el texto revelador permanece oculto antes de responder.

Cada entrada de Notas disponibles tiene una papelera discreta. Las entradas con el mismo texto normalizado o la misma imagen exacta se agrupan automáticamente y se conserva la versión más completa con imagen y descripción.

Cada guardado del Cuaderno sigue siendo una entrada independiente, incluso en el mismo panorama. Si una foto enviada no se puede cargar, la nota permanece visible y se marca para recuperación.

Un resultado bajo vuelve automáticamente al final de la sesión de repaso actual hasta que lo superes. Cada intento se guarda por separado.

El estudio Meta incluye 359 lecciones alojadas localmente, normalizadas de la captura emparejada de OpenGuessr y de ejemplos adicionales de GeoMetas con coordenadas de Street View utilizables. Las explicaciones Meta siguen el idioma de la interfaz en los ocho idiomas compatibles. Usar el entrenador de IA o guardar una entrada del Cuaderno crea o reutiliza automáticamente la tarjeta de Repaso; si no, la tarjeta de ubicación revelada conserva Guardar para repasar. **Notas disponibles** contiene el historial personal y asistido por IA del panorama y de nodos del mismo país situados a menos de 50 metros, con análisis completo, hora exacta y la captura enviada cuando existe; Meta permanece en su bombilla. Coach espera la preferencia de idioma guardada y solicita todos los valores de texto natural en el idioma de IA elegido. El texto personal y de IA finalizado conserva el idioma en que se creó. Repasar una tarjeta ya pendiente avanza su programación incluso desde la práctica personalizada y persiste tras recargar.

Meta elige solo lecciones sin completar. Al terminar las 359, su opción de Aprender queda atenuada y ya no puede seleccionarse.

Una sesión de Estudio o Juego sin terminar se conserva. Al volver puedes elegir **Reanudar**, **Empezar de nuevo** o **Atrás**. La cobertura incluye un mapa de calor continuo de **Dominio**: muchos repasos correctos e intervalos largos iluminan poco a poco países y lugares, mientras que los fallos reducen la intensidad. Al abrir un panorama de Cobertura están disponibles Coach de IA, Cuaderno, Meta vinculada y Notas disponibles; guardar crea o reutiliza su tarjeta de Repaso. Las pistas Meta dependientes de imágenes muestran una advertencia porque las actualizaciones de Street View pueden volverlas obsoletas.

En Cobertura, arrastra el mapa de calor por países y usa la rueda, el deslizador o los botones para cambiar el zoom. Haz clic en un país para abrir su mapa regional con la misma capa. Las regiones se asignan con los datos guardados del lugar o con Google Maps al abrirlo. Algunos países no tienen mapa regional; los lugares cuya región no pueda identificarse quedan sin colorear.

## Estilos y profundidad del Coach de IA

En **Ajustes → Coach de IA** puedes elegir **Preguntar siempre antes del análisis** o un estilo preferido. La profundidad Corta, Normal o Profunda es independiente y cambia el detalle, no el método. No existe modo Adaptive ni cambio automático.

- **⚡ Quick Guess:** países probables, probabilidad relativa, pistas visibles principales y confianza. Es rápido durante la partida, pero enseña menos.
- **🎯 Meta Coach:** clasifica metas como postes, bolardos, líneas, placas, señales, coche de Google y cobertura por nivel S–D, función, fiabilidad y confusores. Es ideal para No Move, aunque algunas metas cambian.
- **🚫 Elimination Coach:** muestra el grupo de candidatos, lo que juega en contra, lo que sigue plausible y la mejor pista separadora. Reduce el anclaje y evita llamar «imposible» a una regla con excepciones.
- **🌍 Deep Geography:** sigue qué es → función → causa → respuesta humana → resultado visible → valor en GeoGuessr. Construye intuición causal, pero declara cuándo una imagen no respalda una explicación histórica, económica o geológica.
- **🧠 Memory Coach:** crea anclas veraces, cadenas de causa y efecto, pares de contraste, contraindicios y preguntas de recuerdo. Favorece la retención sin convertir simplificaciones en absolutos.
- **🏆 Pro Analyst:** pondera pruebas positivas y negativas, contradicciones, independencia, pistas débiles, incertidumbre e información adicional. Es preciso para casos cerrados, pero los porcentajes son estimaciones de IA.

Todos parten de las mismas observaciones visibles y separan lo observado de la inferencia y la especulación. Cada candidato debe explicar la característica concreta, su alcance nacional o regional, el principal confusor, qué los separa y qué pista aumentaría más la confianza. No se inventan siglas, organizaciones, cultivos, historia, geología, industrias ni normas.
Durante un Repaso activo, la cabecera indica la tarjeta actual, las tarjetas restantes y que el progreso está guardado. Al recargar, se conserva el número de tarjetas ya completadas.

El mapa del resultado muestra en azul todas las respuestas anteriores con coordenadas, en rojo la de hoy y en verde la respuesta correcta. La calificación y la cola siguiente se guardan antes de mostrar el resultado, por lo que recargar después de aprobar continúa con la tarjeta siguiente.
