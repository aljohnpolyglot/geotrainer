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

Solo exteriores se aplica junto con la fuente de imágenes: Solo oficiales también solicita exteriores. Para permitir interiores en nuevas ubicaciones de Juego o Aprendizaje personalizado, elige explícitamente Mixto: interiores y exteriores.

Aprender ofrece cuatro opciones: Personalizado, Meta, Explorar mapa y Mapa subido. En Mapa subido, selecciona un JSON de Map Maker con una lista de lugares o `customCoordinates`; cada lugar necesita latitud y longitud válidas. El archivo debe pesar menos de 20 MB. Anterior está antes de Revelar y se activa después de visitar dos lugares. Siguiente avanza por los lugares ya vistos antes de elegir uno nuevo. La X a la derecha de la cabecera abre la elección del modo.

El menú de panoramas del encabezado muestra todos los lugares del archivo JSON desde que se abre la primera vista, incluso los no visitados. Los números siguen el orden del archivo aunque Siguiente use el orden aleatorio. Elige cualquier número para abrir ese lugar; si la vista no está disponible, podrás volver a intentarlo. Anterior y Siguiente siguen el orden de las vistas abiertas. Reanudar recupera el historial de la sesión y, al volver a abrir un mapa, también se recuperan vistas guardadas anteriores cuando se pueden verificar sus entradas. Los lugares del JSON se reconocen por la identidad del punto de origen en Aprender y Jugar aunque Google abra otra panorámica; también se reconocen los ID exactos y los lugares del mismo país a menos de 50 metros de los guardados antiguos. Una tarjeta existente conserva su calendario. La tarjeta del lugar revelado muestra Guardar para repasar solo si aún no existe una tarjeta y confirma rápidamente el nuevo guardado.

En Aprender con JSON importado, **Orden del archivo** está desactivado por defecto. Actívalo para seguir el orden del archivo; déjalo desactivado para mezclar los lugares. La elección se conserva al reanudar una sesión pausada.

El mapa queda en este dispositivo; si continúas en otro, vuelve a subirlo allí. La variación 0 conserva la vista subida; 100 busca Street View hasta 1 km alrededor y vuelve a una ubicación original si hace falta. El botón menos minimiza la ficha del lugar y maximizar la amplía a toda la pantalla.

El punto verde de los mapas del lugar revelado y del resultado tiene un indicador de la dirección de la cámara de Street View. Gira al cambiar la vista; los resultados guardados usan la dirección registrada cuando está disponible.

Mientras estudias o juegas en un lugar generado, GeoTrainer puede preparar el siguiente lugar válido en segundo plano. Así, Siguiente o Continuar puede abrirlo antes. Las imágenes de Street View se cargan al avanzar; si cambias la configuración o el lugar no está disponible, se inicia una nueva búsqueda.

En **Mundo → Muestreo**, elige **Mezcla mundial** con prioridad **Aleatorio** para seguir la frecuencia de países de una muestra de 215 lugares de duelos de OpenGuessr. La muestra incluye 53 países; Estados Unidos apareció 31 veces, India 14, Brasil 12 y Australia 11. Cambia la elección del país en Aprendizaje personalizado y Juego generados, no la fuente de panoramas ni los filtros. Aproxima esta muestra, sin reproducir el algoritmo privado del juego; la disponibilidad puede cambiar los lugares que aparezcan.

Mezcla mundial combina la frecuencia de la muestra (70 %) con el muestreo Natural (30 %), así que también pueden aparecer países ausentes de los duelos. Natural sigue siendo la opción predeterminada.

### Elegir una prioridad de aprendizaje

El aprendizaje con mapa subido etiqueta el progreso de la fuente (por ejemplo, **Fuente: 1/50**). Cada entrada se marca como completada al comprobarla, por lo que **Siguiente** no puede volver a elegirla aunque una variación cercana abra otro panorama; las entradas rotas también se omiten una sola vez. Al terminar, se oculta **Siguiente** y queda **Anterior**. En Juego tampoco se repiten entradas de la fuente.

En Explorar mapa puedes buscar una ciudad, región o país y elegir una sugerencia del catálogo integrado de GeoTrainer para acercar el mapa. Las sugerencias solo mueven el mapa de cobertura; pulsa la cobertura azul para abrir Street View. El texto personal del Cuaderno admite hasta 1000 caracteres por guardado y muestra un contador bajo el editor.

También puedes pegar un enlace completo de Street View de Google Maps en Buscar para abrir ese panorama con la orientación del enlace. La panorámica debe seguir disponible y cumplir los filtros de imágenes y exteriores.

La prioridad cambia cómo se eligen las **nuevas ubicaciones de Aprendizaje personalizado y las rondas de Juego generadas** después de aplicar la colección, la mezcla de países, el entorno, la fuente de imágenes y el filtro de interiores. No cambia los mapas subidos con coordenadas, Meta, Explorar mapa ni Repaso. Los grupos geográficos importados vuelven a Personalizado, donde se aplica la prioridad a las ubicaciones generadas.

- **Aleatorio** (predeterminado) toma muestras del conjunto apto sin usar tu historial. En Mundo reduce el peso de territorios diminutos para que no dominen. Úsalo para obtener variedad o recorrer ampliamente la colección.
- **Lugares conocidos** elige como punto de partida una ubicación apta que ya encontraste y busca aproximadamente entre 1 y 12 km a su alrededor. Sirve para aprender los alrededores y reconocer vistas cercanas sin repetir el panorama exacto.
- **Menor exposición** elige primero un país apto nunca visto o con menos encuentros, rellena las regiones incluidas que aún aparecen grises en Cobertura y después apunta al mayor hueco geográfico restante. Este paso regional también se aplica a colecciones de un solo país; si una región no tiene un punto local utilizable, se vuelve a la búsqueda de huecos de todo el país.

Si no existe historial apto, Lugares conocidos y Menor exposición empiezan desde el conjunto seleccionado como Aleatorio. En una búsqueda de Menor exposición con varios países, GeoTrainer prueba primero el país gris o menos visitado elegido y su objetivo regional. Cada búsqueda sin un panorama válido, incluso si aparece fuera del país solicitado, avanza de inmediato.

Si falla un país nunca visto, se prueban primero los países con cobertura ya comprobada, de menor a mayor exposición, antes de más países desconocidos; los empates se mezclan. El orden se repite hasta encontrar un panorama o hasta que salgas. La cobertura de Street View y los filtros activos siguen determinando si el área objetivo puede ofrecer un panorama, por lo que puede usarse una vista disponible cercana cuando el punto exacto no tiene cobertura.

En Mundo con Menor exposición, un análisis de cobertura incluido omite los países cuyos puntos no encontraron panoramas oficiales navegables. Los conjuntos de países enfocados siguen buscando en todos los países seleccionados.

Estudio es un primer encuentro sin nota. Elige una colección completa, un país objetivo o una mezcla de países que suelas confundir; cada país aparece como una píldora con bandera que puedes quitar. Guardar una pista crea automáticamente una tarjeta reutilizable de Repaso sin inventar una puntuación. La ubicación actual permanece abierta después de guardarla; usa Siguiente cuando quieras avanzar. El estado guardado se recupera al recargar, por lo que la acción no vuelve a aparecer.

Usa los desplegables separados **Regiones** y **Ciudades** y elimina selecciones con sus etiquetas. Las regiones se agrupan por país y las ciudades por región. Sin regiones seleccionadas se usa el país completo. Sin ciudades seleccionadas en una región se incluyen todas las disponibles; elegir ciudades limita solo esa región. Quitar una región elimina sus ciudades; quitar su última ciudad restaura todas las disponibles.

Después de añadir países, puedes añadir regiones y ciudades como píldoras independientes. Las regiones aparecen alfabéticamente; las ciudades se ordenan por importancia según la población de forma predeterminada y también pueden ordenarse alfabéticamente. **Todas las ciudades disponibles** usa los puntos de ciudad incluidos para esa región; no representa todo el polígono administrativo ni garantiza cada carretera o zona rural.

Al iniciar una nueva configuración de Aprender tras salir de una sesión centrada en países, se restaura World y la lista completa de países; Reanudar conserva la sesión guardada. Menor exposición busca primero en el punto elegido y luego amplía la búsqueda local. En Mixto, los reintentos usan puntos de cobertura del país y mantienen los filtros.

La búsqueda sigue intentándolo a un ritmo moderado hasta encontrar una coincidencia o hasta que salgas o cambies la configuración; no se garantiza cobertura en el punto exacto.

Los nombres de las regiones y ciudades siguen el idioma de la interfaz cuando hay un nombre localizado disponible. **Guardar grupo geográfico** descarga las selecciones actuales de países, regiones y ciudades como JSON, sin coordenadas de Street View. **Subir JSON** y **URL JSON** aceptan ese formato editable o un JSON de coordenadas de Map Maker; un grupo geográfico vuelve a Personalizado para editarlo, mientras que las coordenadas permanecen como una fuente finita.

Se muestra el nombre del archivo o de la URL. El endpoint debe permitir acceso desde el navegador (CORS). URL JSON de Aprender y Juego también acepta enlaces a archivos de GitHub con /blob/; el JSON sin formato se carga automáticamente. Los enlaces directos al JSON siguen funcionando. Al volver a cargar la misma URL o un archivo con el mismo nombre, se puede continuar el progreso guardado de Aprender o empezar de nuevo. La elección muestra los lugares completados como x/total.

En **Subir JSON** y **URL JSON**, abre **Mapas guardados** para ver 10 mapas por página. Cada entrada muestra el título legible, el nombre del archivo de origen y el progreso de Aprender. **Reanudar** en Aprender abre la última panorámica guardada; **Usar mapa** en Juego lo selecciona para una partida nueva. El lápiz cambia el nombre sin alterar lugares ni progreso. El nombre aparece sobre el selector de panorámicas. Las rutas y sufijos de descarga como `(2).json` se limpian para mostrar un título legible; el título del JSON tiene prioridad. Se conservan los 30 mapas más recientes y los activos o pausados. Los mapas antiguos y su progreso de origen se eliminan automáticamente, pero los intentos y tarjetas de Repaso permanecen. Vuelve a importar un mapa eliminado para usarlo otra vez.

Continuar conserva los lugares coincidentes si cambia el JSON y vuelve a abrir la última vista guardada si sigue en la lista. Este progreso permanece en este dispositivo.

Los grupos de ligas deportivas verifican la temporada y división solicitadas y seleccionan solo los municipios de los clubes participantes. Sin temporada se usa la actual; sin división, la principal. Los clubes de la misma ciudad generan una sola selección. Una lista no verificada o sin coincidencias produce un error, sin añadir ciudades ajenas; el resultado es un grupo de ciudades, no panoramas exactos de estadios.

La configuración de Juego ofrece cuatro opciones: Personalizado, Importar JSON, URL JSON y Describir un grupo. En URL JSON, pega un enlace directo HTTP o HTTPS al JSON y pulsa Cargar URL. Los mapas de coordenadas conservan sus lugares y limitan las rondas; los grupos geográficos vuelven a Personalizado para editarlos.

En mapas JSON, **Orden de lugares** usa Aleatorio de forma predeterminada; elige Orden del archivo para seguir la lista. **Omitir lugares ya vistos** empieza activado y omite panorámicas ya visitadas o guardadas, incluidas vistas del mismo país a menos de 50 metros. Desactívalo para incluir lugares conocidos. Si no quedan vistas aptas, elige otro mapa o desactiva la opción. Estas elecciones se guardan con la partida. Si el enlace falla o el JSON no es válido, corrígelo o usa Importar JSON.

**Describir un grupo** envía una petición breve a Gemini y abre en Personalizado los países, regiones, ciudades, entorno, nivel urbano, muestreo, prioridad, fuente de imágenes y cobertura interior sugeridos para que puedas revisarlos y editarlos. Las peticiones sobre agricultura y naturaleza amplia eligen Rural; las de arquitectura y calles urbanas, Urbano; y las de suburbios, Suburbano, salvo que indiques otra cosa. Las peticiones sobre ligas deportivas usan ciudades sede únicas y descartan nombres que no se puedan validar con los datos locales. Puedes escribir en cualquier idioma compatible y describir lugares, paisajes o confusiones habituales. Es una sugerencia de IA, no una garantía geográfica.

Durante la creación, el botón indica la fase actual de países, regiones o ciudades.

## Modo Juego

Después de enviar una respuesta en Juego, el resultado puede aparecer antes de que termine de cargar su foto guardada. La foto se añade a la ubicación del mismo intento cuando está lista; puedes continuar con la siguiente ronda.

En **Límite por ronda** de la configuración del juego, elige Sin límite, un valor predefinido o Personalizado para introducir entre 1 y 3600 segundos. La elección se conserva para la siguiente partida; una ronda pausada se reanuda con el tiempo activo restante.

**Vistas ocasionales desde barcos** está activado de forma predeterminada en Aprender personalizado y Juego con lugares generados. Con entorno Mixto, prioridad Aleatoria y muestreo Natural, puede elegir un panorama conocido desde un barco en Madagascar o Bermudas si ese país está en el grupo. Se respetan las reglas de origen de imágenes y movimiento; si la vista no está disponible, se busca un lugar normal. Al desactivarlo se eliminan estos candidatos adicionales. No afecta a grupos de regiones o ciudades, mapas importados, Meta ni Repaso.

### Moverse con teclado

En una ronda con movimiento de Juego o Repaso, haz clic en una flecha de navegación de Street View y mantén pulsada la barra espaciadora para seguir en esa dirección. Suéltala para detenerte. La flecha debe tener el foco: si la barra espaciadora activa otro botón, vuelve a hacer clic en la flecha. Es el control normal del panorama, sin ajuste de velocidad aparte. No Move y NMPZ impiden desplazarse. En Estudio, usa N o el botón Siguiente para avanzar; la barra espaciadora queda libre para moverte en Street View. Puede continuar una ronda terminada si ese botón tiene el foco.

En la configuración de Juego, elige Lugares generados o Mapa subido. Los turnos del mapa subido usan sus lugares sin repetir entradas y el número de turnos se limita a los lugares disponibles.

Juego usa la misma mezcla de países y mide el recuerdo sin ayuda en 1–100 rondas. Tras responder, el resultado muestra el país real, la ciudad, región y vía disponibles, la dirección completa, las coordenadas exactas, la distancia y la puntuación. Cada respuesta crea un intento nuevo y guarda la vista actual para las previsualizaciones. Si se agota el tiempo en Juego, se envía automáticamente el marcador que esté en el mapa, aunque no hayas confirmado. Si no hay marcador, se registra el turno sin respuesta.

Con un ratón, el mapa de respuesta se amplía al pasar el cursor y se reduce al retirarlo, tanto en Juego como en Repaso. Está activado por defecto; desactiva **Ampliar el mapa al pasar el cursor** en **Preferencias → Pantalla → Mapas** para usar solo el botón. El cursor siempre abre un panel flotante, aunque el botón esté configurado en Pantalla completa. En pantallas táctiles, usa el botón. Si arrastras o redimensionas el panel ampliado, permanecerá abierto hasta que lo restaures; se conservan el marcador y la vista del mapa.

En Juego y Repaso, el botón de ampliar abre el mapa de respuesta como panel flotante de forma predeterminada. En **Configuración → Pantalla → Mapas**, cambia **Botón para ampliar el mapa de respuesta** a **Pantalla completa** si prefieres que todo el panel, incluidos los controles de respuesta, ocupe la pantalla visible. En ambos modos puedes arrastrarlo por el encabezado, cambiar su tamaño desde un borde o esquina y restaurar el mapa compacto. El mapa también tiene un botón de pantalla completa independiente para el área del mapa. El marcador permanece en su lugar.

En Juego, la cobertura de Street View y los nombres de vías están desactivados de forma predeterminada en el mapa de respuestas. Usa los botones de capas y texto del encabezado para el mapa actual, o **Configuración → Pantalla → Mapas** para guardar el valor predeterminado. La cobertura azul indica disponibilidad general, pero no garantiza un panorama compatible con los filtros de imágenes o interiores. Los mismos controles aparecen en Repaso y en los mapas de lugares revelados, incluida la tarjeta del lugar guardado.

El icono **Guardar este lugar para repasar**, junto a **Continuar partida**, permite guardar también respuestas correctas. Solo aparece si el lugar mostrado no tiene una tarjeta de repaso, incluidos lugares del mismo país a menos de 50 metros. Funciona al consultar rondas anteriores. Al guardar, el icono desaparece y el resultado sigue abierto; la puntuación y los calendarios existentes se conservan. El guardado persiste tras recargar y la sincronización sigue siendo manual. Si falla, puedes volver a intentarlo. Una breve notificación confirma el guardado para repasar.

## Repaso y programación

Si intentos cercanos de Estudio y Juego comparten una tarjeta, Repaso usa la regla de movimiento de la ronda de Juego: Estándar, No Move o NMPZ. La barra superior muestra ese modo. Tras responder, el panorama permite moverse, girar y hacer zoom.

Los mapas de respuestas de Juego y Repaso tienen botones discretos para la cobertura y los nombres de vías. También aparecen en los mapas de resultados revelados, incluidas las tarjetas de lugares guardados. Los valores predeterminados de Configuración empiezan apagados y se guardan allí; los botones cambian solo la vista actual. Acerca el zoom para ver las vías con cobertura azul; esta guía no garantiza un panorama que cumpla los filtros de imágenes o interiores.

Los mapas de lugares revelados también tienen un botón de límites regionales junto al de nombres de vías. Solo cambia ese mapa; **Configuración → Pantalla → Mapas → Límites regionales** establece el valor predeterminado. Los límites proceden de Google Maps y pueden diferir de las regiones de Estadísticas → Lugares.

Repaso oculta la respuesta hasta tu conjetura. Si un identificador antiguo abre un panorama a más de 10 km de la respuesta guardada, usa una vista válida cerca de las coordenadas guardadas o no abre la tarjeta. Después de responder, el resultado muestra la ciudad, región, vía, dirección completa y coordenadas disponibles, igual que Revelar en Estudio. Minimiza el resultado desde la esquina superior derecha para estudiar el panorama y usa Ver resultado para abrirlo de nuevo.

Las rondas completadas de Juego y Repaso permiten moverse, girar y hacer zoom durante esta inspección, aunque la ronda original los restringiera. La práctica personalizada no cambia tarjetas futuras; al completar una tarjeta ya pendiente, su fecha avanza y persiste tras recargar.

### Personalizar el repaso

El **mínimo diario de repasos** es una meta de progreso: empieza en 50 y se cambia en Configuración → Repaso. **Pasar los repasos pendientes al día siguiente** empieza activado. Al terminar un día, las tarjetas sin completar pasan al siguiente día de repaso y las fechas posteriores se aplazan el mismo número de días. Si hay 100 pendientes y completas 20, las otras 80 pasan a mañana. Los pasos breves de reaprendizaje conservan su hora. Desactivar la opción detiene futuros traslados sin deshacer los anteriores. La meta no limita la cola; calificaciones, intentos e intervalos se conservan.

- **Tarjetas nuevas / día** limita las tarjetas nunca repasadas. **Máximo de repasos / día** limita toda la cola lista, incluidas tarjetas nuevas y anteriores. Ambos límites se aplican juntos. Con 50 nuevas y 500 repasos máximos, puede haber 110 pendientes pero solo 108 listas si dos tarjetas nuevas superan su límite. Inicio y Repaso muestran la cantidad realmente disponible; aumentar el máximo total no evita el límite de tarjetas nuevas.
- **Exigencia de evaluación** controla la calificación automática: Principiante tolera más distancia, Equilibrado combina país y precisión, y Pro exige un resultado más fuerte. Se usan país, distancia, puntuación y tiempo; no hay botones manuales Otra vez/Difícil/Bien/Fácil.
- **Añadir rondas de juego al repaso** es independiente de la calificación: una ronda futura crea una tarjeta si su puntuación está por debajo del umbral elegido o si el país es incorrecto. Cualquiera de las condiciones activadas basta; los perfiles nuevos empiezan con el límite de Difícil/Otra vez activo (3.000 en Equilibrado). Si está activado, las rondas con país incorrecto se guardan para repaso incluso por encima del umbral de puntuación. Siguen contando como respuestas incorrectas.
- **Primer repaso**, **paso de reaprendizaje**, **primer intervalo excelente** e **intervalo máximo** controlan respectivamente el primer vencimiento, el regreso tras fallar, la espera tras un primer resultado excelente y el techo para tarjetas maduras.
- **Tiempo máximo de respuesta** influye en la fluidez de la calificación, no crea necesariamente una cuenta atrás. **Orden** elige más antiguas primero o una cola aleatoria.
- **Hora de reinicio** y **zona horaria** definen cuándo empieza un nuevo día y se renuevan los límites. La detección automática sigue el dispositivo; desactívala para elegir la zona. La vista previa muestra el siguiente repaso real.
**Volver al inicio** es la bandera abajo a la izquierda en Jugar y Repasar cuando se permite moverse. Vuelve al panorama inicial de la ronda conservando la dirección de la vista. En un repaso con variación, vuelve a la vista mostrada al empezar la tarjeta. En móvil, el botón tiene un área táctil mayor y está sobre los controles de respuesta. Sin movimiento se oculta antes de responder; después queda disponible para explorar. La flecha apunta al inicio respecto a tu dirección de vista y el número indica la distancia en línea recta en metros, no por carretera.

- **Variar vista de repaso** conserva la misma tarjeta y planificación, pero puede cambiar el rumbo o usar un panorama cercano en tarjetas maduras. Estándar, Sin movimiento y NMPZ tienen controles de dificultad independientes que empiezan en 0; cada modo usa el panorama y la dirección guardados hasta que aumentes su control en Ajustes → Repaso. Un valor único guardado anteriormente se aplica a los tres modos durante la actualización y después puede cambiarse por separado. Cero conserva la vista original; los fallos reducen la variación y cualquier búsqueda fallida vuelve al ancla sin duplicar tarjetas. Las variantes cercanas usan solo imágenes oficiales de Google en exteriores; si no hay ninguna adecuada, se mantiene la vista guardada.

Un panorama guardado de un colaborador que sigue disponible se abre tal como se aprendió, sin variar la vista. Si ya no está disponible, Repaso busca imágenes oficiales de Google en exteriores a menos de 50 metros del lugar guardado. Si no encuentra ninguna, la tarjeta queda pendiente para reintentar en vez de mostrar otra escena.

Repaso verifica el identificador, la ubicación y el estado del panorama antes de habilitar el mapa de respuesta y empezar a contar el tiempo. Si la imagen sigue negra, el tiempo puede avanzar; recarga la página para reintentar.

Pulsa **Guardar** para aplicar los cambios. La exigencia y los intervalos afectan la programación futura sin reescribir intentos guardados; los límites y el orden se aplican al recalcular la cola.

## Entrenador de IA y pistas

Cuando la estimación del país principal alcanza el 85 %, Coach busca un lugar más preciso. Dos pistas visibles independientes pueden respaldar una zona geográfica amplia (como el Medio Oeste) o una región concreta; una ciudad o un lugar exacto exige pruebas más sólidas. Un porcentaje alto para el país no identifica por sí solo la región. Si la imagen no aporta pruebas suficientes, Coach omite la estimación regional.

En **Configuración → Entrenador de IA**, puedes elegir Gemini, Anthropic o un proveedor compatible con OpenAI, indicar el modelo y pegar tu propia clave de API. La clave se muestra oculta, solo permanece en la memoria de la página y se envía a través del servicio de Coach en cada análisis; GeoTrainer no la guarda. Usa **Olvidar clave** o recarga la página para borrarla. El proveedor aplica sus propios límites y cargos. Las URL compatibles con OpenAI se limitan a proveedores públicos admitidos.

Breve, Normal y Profunda también ajustan el presupuesto de razonamiento de Gemini 2.5 y el nivel de detalle visible; los modelos Gemini 3 usan sus niveles de razonamiento correspondientes.

Juego fija la asistencia de IA al enviar la respuesta. Analizar un error después, incluso con el resultado minimizado o mientras se guarda la respuesta, no cambia ese intento. Restaurar un análisis guardado no cuenta como uso nuevo de IA durante la ronda.

Las etiquetas antiguas de Juego se corrigen automáticamente si se guardó una imagen personal del Cuaderno durante la ronda y no consta ningún análisis de IA. Los análisis de pistas y de 360° conservan su etiqueta de asistencia. Los registros antiguos ambiguos no cambian; se conservan puntuaciones, respuestas, notas y calendarios de Repaso.

Juego usa la misma barra de aprendizaje que Estudio: Cuaderno, el contador de notas cercanas disponibles y el entrenador de IA cuando está activado en la configuración de la partida.

Coach espera el idioma de IA guardado antes del análisis, rechaza resultados claramente multilingües y explica las pistas visibles detrás de cada nuevo país candidato.

Analizar reúne automáticamente varias direcciones y vuelve a la vista actual si hace falta. Solo muestra una estimación de región, ciudad o lugar exacto cuando varias pistas visuales sólidas la respaldan. Tras revelar la respuesta, **Analizar** se convierte en **Explicar**: usa solo referencias del país correcto y admite si la imagen no bastaba para identificarlo. Pistas abre una biblioteca con detalle completo, Street View y enlaces a Google Maps; el filtro muestra el total por país, se ordena de mayor a menor y × lo borra. En Jugar y Repasar, minimizar el resultado muestra **Analizar** sin el contexto de la respuesta guardada; al mostrar de nuevo el resultado, aparece **Explicar**.

En **Pistas → Países**, pulsa un encabezado para ordenar por país, pistas guardadas, confianza media del Coach o actividad más reciente. Púlsalo de nuevo para invertir el orden. Al principio se muestran los países con más pistas.

Las lecciones Meta guardadas expresamente, tanto del curso para principiantes como de los cursos por país, aparecen en Mis pistas con su texto, imagen de referencia si existe y hora exacta de guardado.

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

Los mapas se vuelven a abrir más rápido durante una sesión en Aprender, Jugar, Repasar y los resultados de ubicación. Colocar o arrastrar un marcador no desplaza el mapa. Al recargar la página puede ser necesario descargar las imágenes del mapa; las zonas ya vistas no están garantizadas sin conexión.

En Configuración → Pantalla → Mapas, **Paleta de colores del mapa** permite Automático, Claro u Oscuro. **Zoom del mapa de resultados** ofrece Más cercano, País, Región del país o Mundo; País es el valor predeterminado. Automático sigue la apariencia de la aplicación; Claro usa los colores originales de Google en los mapas de carreteras y relieve, mientras que Oscuro mantiene una paleta oscura aunque cambie el tema de la aplicación. Las imágenes de satélite conservan sus colores.

En un mapa con la respuesta revelada, usa el botón de la mira para acercarte al lugar correcto, el del edificio para ver la ciudad o el del globo para volver a la escala de país. Puedes seguir ampliando y desplazando el mapa; la opción de Configuración solo determina la vista inicial.

Las fronteras nacionales se muestran por defecto y se pueden ocultar; solo aparecen cuando hay una frontera en el área visible del mapa. El grosor y el color de las fronteras se ajustan con una vista previa en vivo; las fronteras regionales están desactivadas por defecto y se pueden activar por separado.

Los países, ciudades y entornos orientan la generación y no representan una cobertura completa. Las preferencias separan idioma de interfaz, juego e IA, además de límites de repaso, zona horaria, apariencia y ayudas del mapa. Los perfiles nuevos usan 50 tarjetas nuevas y 500 repasos diarios. Efectos y música ambiental son opcionales, empiezan apagados y guardan volúmenes separados. Con los efectos activados, Juego con temporizador emite sonidos durante los últimos diez segundos y al agotarse el tiempo. La música cambia de un ritmo tranquilo en Aprender a otro más urgente en Juego y se pausa al ocultar la página.

El idioma de Wikipedia se elige por separado para los enlaces de lugares revelados en Aprender, Juego y Repaso. Si no se encuentra un artículo que coincida en ese idioma, se busca en la Wikipedia en inglés. Si tampoco aparece allí, el nombre queda sin enlace. Los perfiles existentes empiezan con inglés. Los nombres de calles revelados también enlazan a un artículo coincidente; si no lo hay, quedan como texto.

### Objetivos de puntuación por país

Abre Ajustes → Preferencias → Objetivos de puntuación por país. Mantén el mínimo predeterminado para conservar la exigencia actual del Repaso. Elige un país en el desplegable, introduce un mínimo sobre 5.000, pulsa Añadir objetivo y luego Guardar. El lápiz permite editar y × elimina la regla. Los nombres y números siguen el idioma de la interfaz.

Un país incorrecto siempre es un error de entrenamiento. Con el país correcto, una puntuación inferior al mínimo también falla; igualarlo cumple el objetivo. La regla del país sustituye el objetivo predeterminado, pero siguen aplicándose las reglas más estrictas de evaluación y repaso automático. Sin regla propia, se conserva el mínimo predeterminado y las reglas existentes. Cambiar el valor predeterminado afecta a los países sin reglas; restablécelo para volver a la exigencia actual del Repaso.

En Juego y Repaso, un clic en el agua a menos de 25 km de la respuesta se atribuye a su país cuando el mapa no identifica ninguno. Cerca de islas aisladas como Guam, las Islas Marianas del Norte y la Isla de Navidad, también se corrige si el mapa devuelve el nombre de un territorio continental lejano. Se mantienen los puntos por distancia y los objetivos de puntuación; un clic en tierra de otro país sigue siendo incorrecto.

En Repaso, una respuesta en el país correcto a menos de 25 km de estas islas avanza la tarjeta con una calificación Difícil aunque la puntuación quede por debajo del objetivo. Los puntos y el objetivo guardado no cambian; la tarjeta volverá antes para practicar con más precisión.

Juego añade automáticamente al Repaso las rondas por debajo del objetivo. Practicar errores usa los objetivos guardados también en partidas antiguas. Repaso y corrección de errores requieren otro intento si no se alcanza el mínimo. Guardar objetivos no modifica puntos, respuestas, estadísticas de reconocimiento del país, intentos originales ni calendarios existentes; las respuestas nuevas usan los objetivos actualizados. No se comprueban límites de ciudades o regiones.


## Progreso y estadísticas

Los totales de panoramas, intentos y tiempo activo de la página inicial se cargan del progreso guardado en este dispositivo. Se muestran puntos durante la carga; no hace falta sincronizar la cuenta para verlos.

Estadísticas y Cobertura muestran los nombres de países, las fechas y los números con el idioma de interfaz seleccionado, no con la configuración regional predeterminada del navegador. La tabla de países separa las ubicaciones panorámicas únicas de los intentos puntuados; intentos, aciertos, errores, precisión y puntuaciones combinan Juego y Repaso.
 La columna **Lugares únicos** agrupa como un lugar los panoramas del mismo país situados a menos de 50 metros; el mapa y el historial conservan cada panorama e intento. Subir un mapa no marca sus lugares como vistos hasta abrirlos.

Los lugares guardados en Estudio son fuentes sin calificar: cuentan como actividad de Estudio y tarjetas nuevas, no como intentos «Sin respuesta» ni puntuaciones cero. Recargar reanuda la visita actual sin crear otra fila.

Consulta lugares, intentos, cola pendiente, rendimiento, historial y tiempo activo en primer plano durante Estudio, Juego activo y Repaso activo, incluido moverte por panoramas y usar ayudas de aprendizaje. Rendimiento, Geografía, Progreso y Confusiones combinan intentos de Juego y Repaso; la casilla de IA afecta solo al Juego. El tiempo oculto o cerrado no aumenta las nuevas duraciones de respuesta.

El tiempo se guarda al cambiar de sección o volver a Inicio; las sesiones sin visitas ni intentos se ocultan. En una pantalla táctil, mantén pulsada una barra de **Próximos pendientes** para ver la fecha y la cantidad. Pistas conocidas suma entradas personales, de IA y Meta sin duplicar la imagen de una nota. Las rondas con IA se incluyen por defecto y pueden excluirse. El resumen distingue promedio anterior y de hoy; el calendario colorea la actividad. Lugares del mismo país a menos de 50 metros comparten tarjeta.

En Estadísticas → Repasos, **Equilibrar fechas** muestra una vista previa de los próximos 30 días. Pasa el cursor, enfoca o toca una barra para ver su cantidad exacta. Al confirmar, solo se mueven tarjetas futuras dentro de una pequeña parte de su intervalo. Las tarjetas pendientes hoy y los pasos cortos de aprendizaje no cambian. Las respuestas y calificaciones anteriores se conservan. El control de intensidad actualiza la vista previa al instante: muévelo a la izquierda para conservar más fechas o a la derecha para llenar más los días tranquilos. Al 0 %, ninguna tarjeta cambia de fecha. Siempre se respetan los mismos límites de intervalo. En la misma vista previa, usa Restablecer fechas originales para devolver las tarjetas equilibradas que corresponda a sus fechas naturales guardadas y luego confirma. Las tarjetas pendientes hoy tampoco se mueven.
 El tiempo activo de Repaso se detiene mientras está abierto el resultado y continúa al minimizarlo o pasar a la siguiente tarjeta. Coach ofrece Analizar con el resultado oculto y Explicar cuando se muestra.

En Historial, selecciona una fila de lugar para abrir su panorámica guardada con Coach, Cuaderno, Meta y Notas disponibles. El botón de volver regresa al Historial. La flecha externa sigue abriendo Google Maps; el botón de Repaso inicia un repaso con puntuación. Abrir un lugar no modifica los intentos anteriores.

## Sincronización en la nube

Si el inicio de sesión en la nube no está disponible, la ventana de cuenta oculta los controles de acceso. El entrenamiento local y las herramientas para exportar e importar copias siguen disponibles.

La cuenta es opcional y el entrenamiento local funciona sin iniciar sesión. El progreso se guarda primero en este navegador y la sincronización es manual. Pulsa **Sincronizar ahora** en el dispositivo con trabajo nuevo para descargar, combinar y subir tarjetas, intentos e historial de Repaso; después hazlo en los demás dispositivos. La programación calificada más recientemente prevalece y se conservan los registros únicos de cada dispositivo. Iniciar sesión, guardar, volver a la app o salir no transfiere datos automáticamente. Sin iniciar sesión, localhost y el sitio publicado permanecen separados.

Las imágenes privadas que falten se guardan en este navegador durante la sincronización manual. Abrir Pistas, Notas disponibles, Cobertura o el historial usa esa copia local y no consulta el almacenamiento en la nube.

La sincronización usa menos datos sin perder el progreso guardado. Los archivos `.geotrainer` exportados se comprimen, pero siguen incluyendo todos los registros locales y las fotos guardadas. También se pueden importar archivos anteriores.

**Sincronizar y respaldar** también ofrece **Exportar** e **Importar** sin necesitar la nube. Exportar descarga un archivo `.geotrainer` con toda la base local y las fotos guardadas en este dispositivo. Importar valida el archivo y combina solo la información ausente o más reciente sin borrar el progreso local. El archivo incluye el identificador de la cuenta exportadora; si la cuenta actual es distinta o no has iniciado sesión, se pide confirmación. Mantén el archivo privado y pásalo mediante Drive, OneDrive, USB u otro lugar de confianza.

## Solución de problemas

Si Repaso deja de mostrar tarjetas tras un bloqueo o una recarga, comprueba primero que abriste la misma dirección del sitio y el mismo perfil del navegador. No borres los datos del sitio. En **Sincronizar y respaldar → Importar**, elige tu archivo `.geotrainer` más reciente; se combinará con el progreso que aún quede en este dispositivo. Si sincronizaste manualmente trabajo posterior, usa **Sincronizar ahora** para recuperar esa copia de la nube. Es posible que el trabajo posterior a la última exportación o sincronización manual no se pueda recuperar.

1. Panorama vacío — pasa al siguiente; la cobertura de Street View puede cambiar.
2. Controles sobre una pantalla negra — prueba Street View en Google Maps en el mismo navegador. Si también aparece negro, abre GeoTrainer en una ventana privada sin extensiones, cambia la aceleración gráfica del navegador y reinícialo. Actualiza el navegador y el controlador gráfico si hace falta. Si solo falla GeoTrainer, recárgalo una vez e indica el navegador, el dispositivo y las extensiones activas al informar del problema.
3. Repaso vacío — juega o guarda un lugar de Estudio y espera a que venza.
4. IA no disponible — continúa entrenando y prueba más tarde.
5. Progreso antiguo — verifica la cuenta y pulsa **Sincronizar ahora** en cada dispositivo, empezando por el que contiene el trabajo nuevo.

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

Las lecciones Meta usan referencias externas: el texto del curso para principiantes se basa en [GeoMetas](https://geometas.com/), y el texto y las imágenes de los cursos por país proceden de [Plonk It](https://www.plonkit.net/guide). GeoTrainer es independiente de esas guías. Cada lección enlaza con su referencia; consulta el original para ver cambios, ya que la cobertura de Street View y las pistas visuales pueden variar.

En las lecciones para principiantes, primero aparece la pista ilustrada y, cuando la hay, debajo se muestra una comparación con otro país. Las infografías de referencia de los cursos por país aparecen dentro de la lección y del detalle Meta guardado, junto a la explicación. Si caduca un panorama Meta guardado, GeoTrainer busca Street View oficial al aire libre a menos de 50 metros; conserva la vista original si aún está disponible, aunque sea de un colaborador.

Guardar expresamente una entrada del Cuaderno crea o reutiliza una tarjeta nueva de Repaso incluso tras una ronda de Juego con puntuación alta y país correcto. Una pista guardada puede enseñar una región, ciudad, carretera u otro detalle más allá del país.

Las imágenes pegadas, subidas o capturadas en el Cuaderno se pueden recortar antes de analizarlas o guardarlas. Usa el control de edición en la esquina inferior derecha de la vista previa, arrastra el área o sus esquinas y aplica el recorte.

Después de guardar una nota de texto o el análisis de una pista pegada, un aviso confirma que está en el Cuaderno.

La **cámara de 360°** del espacio de trabajo copia cuatro direcciones del panorama actual como una sola imagen. Una notificación muestra el progreso y confirma si la copia se realizó correctamente. La imagen va directamente al portapapeles y no se guarda en GeoTrainer.

Aprender ofrece cuatro rutas. **Personalizado** conserva colecciones y entornos. **Meta** abre lecciones guiadas en el panorama y rumbo guardados. **Explorar mapa** muestra la cobertura de Street View. Los filtros de la esquina inferior izquierda permiten elegir imágenes oficiales, mixtas o de colaboradores y cobertura solo exterior o mixta. En Meta y el mapa, Revelar abre la tarjeta normal, donde Guardar para repasar programa la práctica de ubicación.

En cualquier ruta de Aprender, el mapa de la tarjeta revelada muestra la cobertura azul de Street View de forma predeterminada. Pulsa una zona con cobertura para abrirla en Explorar mapa, o usa el botón de capas para ocultar la cobertura y desactivar la selección en esa vista. Esto no avanza el mapa subido ni una lección Meta. El mapa conserva su zoom y posición tras seleccionar la cobertura. Si Solo oficiales no encuentra nada, el mensaje indica elegir **Oficiales + colaboradores** abajo; nunca cambia ese filtro por ti. La flecha de regreso arriba a la izquierda vuelve al panorama de Aprender, al panorama subido o a la lección Meta de origen; si abriste Explorar mapa directamente, el botón de globo vuelve al mapa mundial.

El panorama abierto desde la cobertura se revela de inmediato y mantiene visible la tarjeta del lugar. Si venías de un mapa JSON subido, la flecha de volver arriba a la izquierda regresa directamente al panorama exacto de origen sin avanzar el progreso de la fuente; en los demás casos, el globo abre el mapa mundial.

Aprender personalizado y Juego usan imágenes oficiales de Google de forma predeterminada; el selector permite mezclar panoramas oficiales y de colaboradores o solicitar solo panoramas de colaboradores. **Permitir interiores** está desactivado de forma predeterminada en ambas configuraciones; al activarlo, Google puede devolver cobertura de Street View tanto interior como exterior.

En **Configuración → Pantalla** puedes controlar nombres de calles, fecha de imagen, movimiento del teléfono, forma de desplazarte, tipo de mapa, gestos, lugares interactivos y colores de GeoTrainer. Los nombres de calles y los lugares interactivos vienen desactivados para evitar pistas accidentales.

Activa los nombres de calles cuando quieras aprender cómo se nombran las calles y carreteras en distintos lugares. Esos nombres también pueden revelar dónde estás, así que vuelve a desactivarlos cuando quieras adivinar sin esa pista.

La bombilla superior derecha abre o cierra la explicación. El aviso inicial puede cerrarse una vez u ocultarse para siempre sin eliminar lecciones. Un Meta entra en **Mis pistas** solo al guardar explícitamente su ubicación para repasar. En Repaso, el panel Meta está oculto de forma predeterminada; ábrelo para leer todo su contenido.

En el Estudio Meta, cada panorama nuevo deja la explicación detrás de la bombilla superior derecha. Púlsala cuando quieras ver la imagen de referencia y las notas. En Configuración → Pantalla → Meta puedes activar la apertura automática de cada lección. En Repaso, el panel Meta sigue cerrado hasta que lo abras.

Meta ofrece un curso para principiantes y 131 cursos por país. Las lecciones abren la panorámica orientada hacia la pista. Si Google la ha reemplazado, se busca una nueva vista a menos de 50 metros con la misma orientación. Las panorámicas no disponibles se omiten sin marcar la lección como vista; si no queda ninguna, vuelves a la configuración. se muestra una imagen local de ejemplo cuando existe. El panel Meta de Repaso está oculto de forma predeterminada; ábrelo para leer todo el contenido.

Siguiente marca la lección como vista y actualiza el progreso aunque no elijas Guardar para repasar. Anterior vuelve a la lección previa y el contador muestra 1/N. Meta sirve para estudiar pistas: no hay un ciclo de dos intentos ni tarjetas de Repaso automáticas por distancia.

Los 29 cursos temáticos de GeoCoach reúnen 947 lecciones sobre señales, marcas viales, coches, idiomas y pistas regionales. Las explicaciones y los enlaces a las panorámicas elegidas se guardan en GeoTrainer, así que las lecciones no dependen de la API de GeoCoach durante el juego. Cada lección enlaza el mapa original y acredita a su creador. Si una vista no está disponible, se omite igual que en los demás cursos Meta. Mientras se carga una imagen de referencia Meta, aparece un marcador de carga.

Cuando GeoCoach proporciona una foto de la pista, aparece en la lección, el explorador de lecciones y el detalle guardado. Las lecciones sin foto de origen siguen mostrando su panorama y explicación.

Los cursos para principiantes y por tema tienen miniaturas locales, y el nombre del curso activo aparece en la barra de Aprender. Selecciona una imagen de referencia Meta para ampliarla; ciérrala con X o Escape. En la tarjeta de ubicación revelada, el nombre del lugar enlaza a Wikipedia si la búsqueda encuentra resultados; si no, queda como texto y aparece un aviso.

 En el curso para principiantes, Siguiente abre otra lección pendiente y Anterior vuelve a una lección visitada anteriormente, incluso después de recargar; al terminar, vuelves a la selección del curso; en los cursos por país avanza dentro de ese país.  Puedes buscar cursos temáticos y por país; los cursos por país se ordenan alfabéticamente, por cantidad de lecciones o por progreso. Empezar de nuevo abre las opciones de Estudio; Reanudar conserva la lección guardada. Todas las lecciones por país muestran ahora su imagen de referencia desde este sitio.
Elige el curso para principiantes, un tema o un país en el selector; cada curso muestra su porcentaje de finalización. **Empezar a aprender** abre una lección pendiente del curso seleccionado y tiene en cuenta el progreso guardado. **Explorar lecciones Meta** abre la lista si quieres elegir una lección concreta; busca en el texto y filtra entre todas, pendientes o completadas. Elige cualquier lección, incluso una completada, y usa **Iniciar la lección elegida** para abrirla. Volver a abrir una lección completada conserva su estado y no programa una tarjeta de Repaso. El contenido del curso usa el idioma de la interfaz, independientemente de los idiomas del juego y de la IA.

El **Cuaderno** guarda cualquier cantidad de notas personales por panorama. La categoría y el texto son opcionales; una entrada vacía también puede guardar el lugar para repasar. También admite imágenes analizadas por Coach. Puedes escribir y guardar una nota nueva durante el repaso; su análisis de imagen no revela la respuesta antes del intento. Las entradas personales, de IA y Meta abren una vista detallada con Street View y una imagen superpuesta cuando existe.

En el detalle de una pista visual guardada puedes añadir o editar su nota, guardarla y abrir la imagen a pantalla completa. Las imágenes idénticas solo se combinan cuando la nota o descripción también coincide o está vacía; si el texto útil es distinto, permanecen separadas. **Notas disponibles** muestra un contador y el historial desplazable completo; los nuevos análisis de Coach aparecen allí de inmediato y no vuelven a abrirse como resultado activo tras recargar.

Mis pistas permite filtrar **Personales**, **Con ayuda de IA** y **Lecciones Meta** y pagina 20 resultados coincidentes a la vez; el texto revelador permanece oculto antes de responder.

Cada entrada de Notas disponibles tiene una papelera discreta. Las entradas con el mismo texto normalizado o la misma imagen exacta se agrupan automáticamente y se conserva la versión más completa con imagen y descripción.

Cada guardado del Cuaderno sigue siendo una entrada independiente, incluso en el mismo panorama. Si una foto enviada no se puede cargar, la nota permanece visible y se marca para recuperación.

Un resultado bajo vuelve automáticamente al final de la sesión de repaso actual hasta que lo superes, incluso si recargas la sesión activa. Cada intento se guarda por separado y el aprobado posterior avanza la tarjeta en vez de dejarla pendiente de inmediato.

**Notas disponibles** contiene el historial personal y asistido por IA del panorama y de nodos del mismo país situados a menos de 50 metros, con análisis completo, hora exacta y la captura enviada cuando existe; Meta permanece en su bombilla. Coach espera la preferencia de idioma guardada y solicita todos los valores de texto natural en el idioma de IA elegido. El texto personal y de IA finalizado conserva el idioma en que se creó. Repasar una tarjeta ya pendiente avanza su programación incluso desde la práctica personalizada y persiste tras recargar.


Una sesión de Estudio o Juego sin terminar se conserva. Al volver puedes elegir **Reanudar**, **Empezar de nuevo** o **Atrás**. La cobertura incluye un mapa de calor continuo de **Dominio**: muchos repasos correctos e intervalos largos iluminan poco a poco países y lugares, mientras que los fallos reducen la intensidad. Al abrir un panorama de Cobertura están disponibles Coach de IA, Cuaderno, Meta vinculada y Notas disponibles; guardar crea o reutiliza su tarjeta de Repaso. Las pistas Meta dependientes de imágenes muestran una advertencia porque las actualizaciones de Street View pueden volverlas obsoletas.

En Cobertura, arrastra el mapa de calor por países y usa la rueda, el deslizador o los botones para cambiar el zoom. En Exposición, los colores distinguen mejor los recuentos bajos de encuentros y mantienen una referencia superior fija. Haz clic en un país para abrir su mapa regional con la misma capa. Las regiones se asignan con los datos guardados del lugar o con Google Maps al abrirlo. Los nombres de región guardados o proporcionados por Google se comparan con traducciones locales, incluidas variantes rusas y suecas. Algunos países no tienen mapa regional; los lugares cuya región no pueda identificarse quedan sin colorear.

Repaso guarda la respuesta, la programación, la cola restante, las estadísticas completadas y el resultado antes de mostrarlo. Reabrir el mismo sitio en el mismo perfil del navegador restaura la posición (por ejemplo, tarjeta 90 de 150) y el resultado abierto. Continuar avanza sin volver a calificar. Juego guarda el tiempo activo durante la ronda, incluso sin límite de tiempo; el tiempo con la aplicación cerrada no cuenta. El progreso guardado sobrevive a una desconexión, pero Street View necesita internet. Si falla una panorámica, puedes reintentar la tarjeta. La sincronización sigue siendo manual. Borrar los datos del sitio o usar un perfil temporal puede eliminar el progreso local; conserva una copia portátil para recuperarlo.

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

El mapa del resultado muestra en azul todas las respuestas anteriores con coordenadas, en rojo la de hoy y en verde la respuesta correcta.
