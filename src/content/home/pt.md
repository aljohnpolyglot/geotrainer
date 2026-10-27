# Aprenda um lugar. Recorde. Guarde.

O GeoTrainer transforma a prática no Street View em memória geográfica duradoura. Encontre lugares, teste-se sem dicas e retorne aos pontos fracos no momento mais útil.

## Início rápido

Comece com um panorama novo. Seus erros criam automaticamente a fila de revisão.

## Recordação ativa

Um lugar pode parecer familiar; dizer onde fica prova o que você consegue recordar. Jogar e Revisar pedem um palpite antes de mostrar a resposta, fortalecendo a memória e revelando incertezas.

## Use ou perca

Pistas geográficas desaparecem quando são vistas apenas uma vez. O GeoTrainer guarda cada tentativa e traz de volta os lugares difíceis sem repetir tudo igualmente.

## Repetição espaçada

Um palpite fraco retorna mais cedo; uma resposta forte espera mais. Distância e pontuação definem automaticamente quando revisar.

## Seu ciclo de treino

1. Estude — Explore panoramas desconhecidos e aprenda quais pistas visíveis importam.
2. Jogue — Faça um palpite sem ajuda para medir o que você lembra.
3. Revise — Retorne aos lugares fracos no momento certo até reconhecê-los com segurança.

## Como o GeoTrainer complementa o GeoGuessr

O [GeoGuessr](https://www.geoguessr.com/) se destaca em exploração, variedade de mapas, desafios solo, multijogador e competição. O GeoTrainer foca no intervalo entre partidas: transforma encontros e erros em um plano duradouro com estudo sem nota, histórico de tentativas, repetição espaçada automática, misturas de países confundíveis e pistas salvas. Use o GeoGuessr para explorar e competir; use o GeoTrainer para entender erros, treinar confusões e fixar o aprendizado. É um complemento, não um substituto.

## Modo Estudo

No Estudo personalizado, no Jogo e nas escolhas de panorama em Explorar mapa, **Cobertura interna** oferece Somente exteriores (padrão) ou Misto: interiores e exteriores. O Google não oferece uma busca confiável apenas por interiores; o modo misto pode mostrar ambos. Isso não altera mapas enviados, Meta ou Revisão.

Somente exteriores funciona junto com a fonte de imagens: Somente oficiais também solicita cobertura externa. Para permitir interiores em novos locais de Jogo ou Aprender personalizado, escolha explicitamente Misto: interiores e exteriores.

Aprender oferece quatro opções: Personalizado, Meta, Explorar mapa e Mapa enviado. Em Mapa enviado, selecione um JSON do Map Maker com uma lista de locais ou `customCoordinates`; cada local precisa de latitude e longitude válidas. O arquivo deve ter menos de 20 MB. Anterior fica antes de Revelar e é ativado depois de visitar dois locais. Próximo avança primeiro pelos locais já vistos e depois escolhe um novo. O X à direita do cabeçalho abre a escolha do modo.

O menu de panoramas no cabeçalho mostra todos os locais do JSON assim que a primeira vista abre, inclusive os ainda não visitados. A numeração segue a ordem do arquivo, mesmo quando Próximo usa embaralhamento. Escolha qualquer número para abrir aquele local; se a vista estiver indisponível, ela poderá ser tentada novamente. Anterior e Próximo percorrem as vistas abertas. Retomar restaura o histórico da sessão e, ao reabrir um mapa, as vistas anteriores salvas são recuperadas quando suas entradas podem ser verificadas. Locais do JSON são reconhecidos pela identidade do ponto de origem em Aprender e Jogar, mesmo que o Google abra outro panorama; IDs exatos e locais no mesmo país a até 50 metros também reconhecem salvamentos antigos. Um cartão existente mantém seu agendamento. O cartão do local revelado mostra Salvar para revisão apenas quando ainda não existe um cartão e confirma rapidamente o novo salvamento.

No Aprender com JSON enviado, **Ordem do arquivo** fica desativada por padrão. Ative-a para seguir a ordem do arquivo; deixe-a desativada para embaralhar os locais. A escolha é mantida ao retomar uma sessão pausada.

O mapa fica neste dispositivo; envie-o novamente em outro dispositivo para continuar. A variação 0 mantém a vista enviada; 100 procura Street View até 1 km ao redor e volta a um local original quando necessário. O botão de menos minimiza a ficha do local e maximizar a expande para toda a tela.

O ponto verde nos mapas do local revelado e do resultado indica a direção da câmera do Street View. Ele gira com a vista; os resultados salvos usam a direção registrada quando disponível.

Enquanto você estuda ou joga em um local gerado, o GeoTrainer pode preparar o próximo local válido em segundo plano. Assim, Próximo ou Continuar pode abri-lo mais rápido. As imagens do Street View só são carregadas quando você avança; uma configuração alterada ou um local indisponível inicia uma nova busca.

Em **Mundo → Amostragem**, escolha **Mistura mundial** com prioridade **Aleatório** para seguir a frequência de países em uma amostra de 215 locais de duelos do OpenGuessr. A amostra inclui 53 países; os Estados Unidos apareceram 31 vezes, a Índia 14, o Brasil 12 e a Austrália 11. Isso altera a escolha do país no Aprendizado personalizado e no Jogo gerados, não a fonte dos panoramas nem os filtros. É uma aproximação da amostra, não do algoritmo privado do jogo; a disponibilidade pode alterar os locais exibidos.

Mistura mundial combina a frequência da amostra (70%) com a amostragem Natural (30%), então países ausentes dos duelos ainda podem aparecer. Natural continua sendo o padrão.

### Escolher uma prioridade de aprendizagem

O aprendizado com mapa enviado identifica o progresso da fonte (por exemplo, **Fonte: 1/50**). Cada entrada é marcada como concluída ao ser verificada, portanto **Próximo** não pode escolhê-la novamente mesmo que uma variação próxima abra outro panorama; entradas quebradas também são ignoradas uma única vez. Ao concluir, **Próximo** desaparece e resta **Anterior**. O Jogo também não repete entradas da fonte.

Em Explorar mapa, pesquise uma cidade, região ou país e escolha uma sugestão do catálogo integrado do GeoTrainer para aproximar o mapa. As sugestões apenas movem o mapa de cobertura; clique na cobertura azul para abrir o Street View. O texto pessoal do Caderno aceita até 1000 caracteres por salvamento e mostra um contador abaixo do editor.

Você também pode colar um link completo do Street View do Google Maps na busca para abrir aquele panorama na direção do link. O panorama precisa estar disponível e corresponder aos filtros de imagens e áreas externas.

A prioridade muda como os **novos locais do Aprendizado personalizado e as rodadas geradas do Jogo** são escolhidos depois da coleção, mistura de países, ambiente, fonte das imagens e filtro de interiores. Ela não altera mapas enviados com coordenadas, Meta, Explorar mapa ou Revisão. Grupos geográficos importados voltam ao Personalizado, onde a prioridade se aplica aos locais gerados.

- **Aleatório** (padrão) seleciona no conjunto elegível sem usar seu histórico. No Mundo, reduz o peso de territórios muito pequenos para que não dominem. Use para obter variedade ou percorrer amplamente a coleção.
- **Locais familiares** escolhe um local elegível já encontrado como ponto de partida e procura aproximadamente entre 1 e 12 km ao redor dele. Use para aprender os arredores e reconhecer vistas próximas sem repetir o panorama exato.
- **Menor exposição** escolhe primeiro um país elegível ainda não visto ou com menos encontros, preenche as regiões incluídas que ainda aparecem em cinza na Cobertura e depois mira a maior lacuna geográfica restante. Essa etapa regional também vale para coleções de um único país; regiões sem um ponto local utilizável voltam à busca de lacunas no país inteiro.

Quando não há histórico elegível, Locais familiares e Menor exposição começam no conjunto selecionado como Aleatório. Em uma busca de Menor exposição com vários países, o GeoTrainer tenta primeiro o país cinza ou menos visitado escolhido e seu alvo regional. Cada busca sem um panorama válido, inclusive quando ele aparece fora do país solicitado, avança imediatamente.

Se um país nunca visto falhar, os países com cobertura já comprovada são tentados da menor para a maior exposição antes de outros países desconhecidos; empates são embaralhados. A ordem se repete até encontrar um panorama ou até você sair. A cobertura do Street View e os filtros ativos ainda determinam se a área alvo pode fornecer um panorama; uma vista disponível próxima pode ser usada quando o ponto exato não tem cobertura.

Em Mundo com Menor exposição, uma verificação de cobertura incluída ignora países cujos pontos não encontraram panoramas oficiais navegáveis. Conjuntos focados continuam pesquisando todos os países selecionados.

Estudo é um primeiro contato sem nota. Escolha a coleção inteira, um país-alvo ou uma mistura de países que você costuma confundir; cada país aparece como uma pílula com bandeira removível. Salvar uma pista cria automaticamente um cartão reutilizável de Revisão sem inventar pontuação. O local atual permanece aberto após o salvamento; use Próximo quando quiser avançar. O estado salvo é restaurado após recarregar, então a ação não reaparece.

Use os menus separados **Regiões** e **Cidades** e remova seleções pelas pílulas. As regiões são agrupadas por país e as cidades por região. Sem regiões selecionadas, vale o conjunto normal do país inteiro. Sem cidades selecionadas numa região, todas as disponíveis são incluídas; escolher cidades restringe apenas essa região. Remover uma região remove suas cidades; remover a última cidade restaura todas as disponíveis.

Depois de adicionar países, você pode adicionar regiões e cidades como pílulas independentes. As regiões aparecem em ordem alfabética; as cidades usam por padrão a importância pela população e também podem ser ordenadas alfabeticamente. **Todas as cidades disponíveis** usa os pontos de cidades incluídos na região; não representa todo o polígono administrativo nem garante cada estrada ou área rural.

Ao abrir uma nova configuração de Aprender após sair de uma sessão focada, World e a lista completa de países são restaurados; Retomar mantém a sessão salva. Menor exposição procura primeiro no ponto escolhido e depois amplia a busca local. Em Misto, novas tentativas usam pontos de cobertura do país e mantêm os filtros. A busca continua tentando em ritmo moderado até encontrar uma correspondência ou até você sair ou alterar a configuração; não há garantia de cobertura no ponto exato.

Os nomes das regiões e cidades seguem o idioma da interface quando há um nome localizado disponível. **Salvar conjunto geográfico** baixa as escolhas atuais de países, regiões e cidades como JSON, sem coordenadas do Street View. **Enviar JSON** e **URL JSON** aceitam esse formato editável ou um JSON de coordenadas do Map Maker; um conjunto geográfico volta para Personalizado para edição, enquanto as coordenadas permanecem como uma fonte finita. O nome do arquivo ou da URL é exibido.

O endpoint precisa permitir acesso pelo navegador (CORS). URL JSON em Aprender e Jogo também aceita links de arquivos do GitHub com /blob/; o JSON bruto é carregado automaticamente. Links diretos para JSON continuam funcionando. Ao carregar novamente a mesma URL ou um arquivo com o mesmo nome, você pode continuar o progresso salvo em Aprender ou recomeçar. A escolha mostra os locais concluídos como x/total.

Em **Enviar JSON** e **URL JSON**, abra **Mapas salvos** para ver 10 mapas por página. Cada item mostra o título legível, o nome do arquivo de origem e o progresso de Aprender. **Retomar** em Aprender abre o último panorama salvo; **Usar mapa** em Jogo seleciona o mapa para uma nova partida. O lápis renomeia o mapa sem alterar locais ou progresso. O nome aparece acima do seletor de panoramas. Caminhos e sufixos de download como `(2).json` são simplificados; o título no JSON tem prioridade. Os 30 mapas mais recentes são mantidos, assim como os ativos ou pausados. Mapas antigos e o progresso da fonte são removidos automaticamente, mas tentativas e cartões de Revisão permanecem. Reimporte um mapa removido para usá-lo novamente.

Continuar preserva os locais correspondentes se o JSON mudar e reabre a última vista salva se ela ainda estiver na lista. Esse progresso fica neste dispositivo.

Conjuntos de ligas esportivas verificam a temporada e divisão pedidas e selecionam apenas os municípios dos clubes participantes. Sem temporada, usam a atual; sem divisão, a principal. Clubes da mesma cidade geram uma única seleção. Uma lista não verificada ou sem correspondências gera erro, sem incluir cidades alheias; o resultado é um conjunto de cidades, não panoramas exatos de estádios.

A configuração de Jogo oferece quatro opções: Personalizado, Carregar JSON, URL JSON e Descrever um grupo. Em URL JSON, cole um link direto HTTP ou HTTPS para o JSON e escolha Carregar URL. Mapas de coordenadas mantêm seus locais e limitam as rodadas; grupos geográficos voltam para Personalizado para edição.

Nos mapas JSON, **Ordem dos locais** usa Aleatório por padrão; escolha Ordem do arquivo para seguir a lista. **Ignorar locais já vistos** começa ativado e ignora panoramas já visitados ou salvos, inclusive vistas do mesmo país a até 50 metros. Desative para incluir locais conhecidos. Se não houver vistas elegíveis, escolha outro mapa ou desative a opção. Essas escolhas são salvas com a partida. Se o link falhar ou o JSON for inválido, corrija-o ou use Carregar JSON.

**Descrever um conjunto** envia um pedido curto ao Gemini e abre em Personalizado os países, regiões, cidades, ambiente, nível urbano, amostragem, prioridade, fonte das imagens e cobertura interna sugeridos para você revisar e editar. Pedidos sobre agricultura e natureza ampla escolhem Rural; arquitetura e ruas urbanas escolhem Urbano; e subúrbios escolhem Suburbano, salvo indicação contrária. Pedidos sobre ligas esportivas usam cidades-sede únicas e descartam nomes que não possam ser validados com os dados locais. Você pode escrever em qualquer idioma compatível e descrever lugares, paisagens ou confusões comuns. É uma sugestão de IA, não uma garantia geográfica.

Durante a criação, o botão mostra a etapa atual de países, regiões ou cidades.

## Modo Jogo

Depois de enviar um palpite no Jogo, o resultado pode aparecer antes de a foto salva terminar de carregar. A foto é adicionada ao local da mesma tentativa quando estiver pronta; você pode continuar para a próxima rodada.

Em **Limite por rodada** nas configurações do jogo, escolha Ilimitado, uma opção predefinida ou Personalizado para inserir de 1 a 3600 segundos. A escolha fica salva para o próximo jogo; uma rodada pausada retoma com o tempo ativo restante.

**Vistas ocasionais de barco** vem ativado em Aprender personalizado e Jogo com locais gerados. Com ambiente Misto, prioridade Aleatória e amostragem Natural, pode escolher um panorama conhecido de barco em Madagascar ou Bermudas quando o país estiver no grupo. As regras de origem das imagens e movimento continuam valendo; se a vista não estiver disponível, a busca segue com locais normais. Desativar a opção remove esses candidatos extras. Grupos de regiões ou cidades, mapas carregados, Meta e Revisão não são afetados.

### Mover-se com o teclado

Em uma rodada com movimento no Jogo ou na Revisão, clique em uma seta de navegação do Street View e mantenha a barra de espaço pressionada para continuar naquela direção. Solte a tecla para parar. A seta precisa estar em foco: se a barra de espaço ativar outro botão, clique novamente na seta. Esse é o controle normal do panorama; não há ajuste de velocidade separado. No Move e NMPZ impedem deslocamentos. No Estudo, use N ou o botão Seguinte para avançar; a barra de espaço fica livre para se mover no Street View. Ela ainda pode continuar uma rodada concluída se esse botão estiver em foco.

Na configuração do Jogo, escolha Locais gerados ou Mapa enviado. As rodadas usam os locais do mapa sem repetir entradas, e o número de rodadas fica limitado aos locais disponíveis.

Jogo usa a mesma mistura de países e mede a recordação sem ajuda em 1–100 rodadas. Depois do palpite, o resultado mostra o país real, cidade, região e via disponíveis, o endereço completo, as coordenadas exatas, a distância e a pontuação. Cada palpite vira uma nova tentativa e salva a vista atual para prévias. Quando o tempo acaba no Jogo, o marcador que estiver no mapa é enviado automaticamente, mesmo sem confirmação. Sem marcador, a rodada fica registrada sem palpite.

Com um mouse, o mapa de palpite se amplia ao passar o cursor e diminui ao afastá-lo, no Jogo e na Revisão. A opção vem ativada; desative **Ampliar o mapa ao passar o cursor** em **Preferências → Exibição → Mapas** para usar apenas o botão. O cursor sempre abre um painel flutuante, mesmo se o botão estiver configurado para Tela cheia. Em telas sensíveis ao toque, use o botão. Arrastar ou redimensionar o painel ampliado o mantém aberto até restaurá-lo; o marcador e a vista do mapa são preservados.

No Jogo e na Revisão, o botão de ampliar abre o mapa de palpite como painel flutuante por padrão. Em **Configurações → Exibição → Mapas**, defina **Botão de ampliação do mapa de palpite** como **Tela cheia** se preferir que todo o painel, inclusive os controles de palpite, ocupe a tela visível. Em ambos os modos, arraste-o pelo cabeçalho, redimensione-o por uma borda ou canto e restaure o mapa compacto. O mapa também tem um botão de tela cheia separado para a área do mapa. O marcador permanece no lugar.

No Jogo, a cobertura do Street View e os nomes de ruas ficam desativados por padrão no mapa de palpites. Use os botões de camadas e texto no cabeçalho para o mapa atual, ou **Configurações → Exibição → Mapas** para salvar o padrão. A cobertura azul indica disponibilidade geral, mas não garante um panorama compatível com os filtros de imagens ou interiores. Os mesmos controles aparecem na Revisão e nos mapas dos locais revelados, incluindo o cartão do local salvo.

O ícone **Salvar este local para revisão**, ao lado de **Continuar jogo**, permite guardar também respostas corretas. Ele só aparece se o local exibido ainda não tiver um cartão de revisão, incluindo locais do mesmo país a até 50 metros. Também funciona nas rodadas anteriores. Ao salvar, o ícone desaparece e o resultado continua aberto, sem alterar a pontuação ou agendamentos existentes. O estado salvo permanece após recarregar e a sincronização continua manual. Se falhar, tente novamente. Uma breve notificação confirma o salvamento para revisão.

## Revisão e agendamento

Quando tentativas próximas de Estudo e Jogo compartilham um cartão, a Revisão usa a regra de movimento da rodada de Jogo: Padrão, No Move ou NMPZ. A barra superior mostra esse modo. Após a resposta, o panorama permite deslocamento, rotação e zoom.

Os mapas de palpites do Jogo e da Revisão têm botões discretos para cobertura e nomes de ruas. Eles também aparecem nos mapas de resultados revelados, incluindo cartões de locais salvos. Os padrões em Configurações começam desligados e são salvos ali; os botões alteram apenas a vista atual. Aproxime o zoom para ver as vias com cobertura azul; o guia não garante um panorama compatível com os filtros de imagens ou interiores.

Os mapas de locais revelados também têm um botão de limites regionais ao lado do botão de nomes de ruas. Ele altera apenas esse mapa; **Configurações → Exibição → Mapas → Limites regionais** define o padrão. Os limites vêm do Google Maps e podem diferir das regiões em Estatísticas → Lugares.

A resposta fica oculta até o palpite. Se um ID antigo abrir um panorama a mais de 10 km da resposta salva, a Revisão usa uma vista válida perto das coordenadas salvas ou não abre o cartão. Depois da resposta, o resultado mostra cidade, região, via, endereço completo e coordenadas disponíveis, como Revelar no Estudo. Minimize o resultado no canto superior direito para estudar o panorama e use Ver resultado para abri-lo novamente. Rodadas concluídas de Jogo e Revisão liberam movimento, rotação e zoom durante essa inspeção, mesmo quando a rodada original os restringia. A prática personalizada não altera cartões futuros; concluir um cartão já vencido avança sua data e persiste após recarregar.

### Personalizar a revisão

O **mínimo diário de revisões** é uma meta de progresso: começa em 50 e pode ser alterado em Configurações → Revisão. **Passar revisões pendentes para o dia seguinte** começa ativado. Ao fim do dia, cartões não concluídos passam ao próximo dia de revisão e os vencimentos posteriores são adiados pelo mesmo número de dias. Se 100 estiverem pendentes e você concluir 20, os outros 80 ficam para amanhã. Etapas curtas de reaprendizagem mantêm seus horários. Desativar a opção impede novos adiamentos sem desfazer os anteriores. A meta não limita a fila; notas, tentativas e intervalos são preservados.

- **Novos cartões / dia** limita cartões nunca revisados. **Máximo de revisões / dia** limita toda a fila pronta, incluindo cartões novos e antigos. Os dois limites valem juntos. Com 50 novos e 500 revisões máximas, 110 cartões podem estar vencidos, mas só 108 prontos se dois novos excederem o limite. Início e Revisão mostram a quantidade realmente disponível; aumentar o máximo total não ignora o limite de novos cartões.
- **Rigor da avaliação** controla a nota automática: Iniciante tolera maior distância, Equilibrado combina país e precisão, e Pro exige resultado mais forte. País, distância, pontuação e tempo são considerados; não há botões manuais Novamente/Difícil/Bom/Fácil.
- **Adicionar rodadas de jogo à revisão** é separado da avaliação: uma rodada futura cria um cartão se a pontuação ficar abaixo do limite escolhido ou se o país estiver errado. Qualquer condição ativada basta; perfis novos começam no limite ativo de Difícil/Novamente (3.000 em Equilibrado). Quando ativado, rodadas com país errado são salvas para revisão mesmo acima do limite de pontuação. Continuam contando como respostas erradas.
- **Primeira revisão**, **etapa de reaprendizado**, **primeiro intervalo excelente** e **intervalo máximo** controlam o primeiro vencimento, o retorno após erro, a espera após um primeiro resultado excelente e o teto de cartões maduros.
- **Tempo máximo de resposta** influencia a fluência da avaliação, sem necessariamente criar contagem regressiva. **Ordem** escolhe mais antigos primeiro ou fila aleatória.
- **Hora de redefinição** e **fuso horário** definem o início do novo dia e a renovação dos limites. A detecção automática segue o dispositivo; desligue-a para escolher o fuso. A prévia mostra a próxima revisão real.
**Voltar ao início** é a bandeira no canto inferior esquerdo em Jogar e Revisar quando o movimento é permitido. Retorna ao panorama inicial da rodada mantendo a direção da vista. Em uma revisão variada, retorna à vista mostrada no início do cartão. No celular, o botão maior fica acima dos controles de resposta. Sem movimento, fica oculto antes da resposta e disponível depois para explorar. A seta aponta para o início em relação à direção da vista, e o número mostra a distância em linha reta em metros, não pela estrada.

- **Variar vista de revisão** mantém o mesmo cartão e agenda, mas pode mudar a direção ou usar um panorama próximo em cartões maduros. Cartões NMPZ sempre usam o panorama e a direção da câmera salvos, independentemente desta configuração. A dificuldade começa em 0: o panorama e a direção salvos são usados até você escolher um valor maior em Configurações → Revisão. Valores já salvos são mantidos. Zero mantém a vista original; erros reduzem a variação e falhas de busca retornam à âncora sem duplicar cartões. As variações próximas usam apenas imagens oficiais do Google ao ar livre; sem um resultado adequado, a vista salva é mantida. A vista original e mudanças apenas de direção conservam as imagens salvas.

Um panorama salvo de um colaborador que ainda esteja disponível abre exatamente como foi aprendido, sem variar a vista. Se deixar de estar disponível, a Revisão procura imagens oficiais do Google ao ar livre num raio de 50 metros do local salvo. Sem resultado, o cartão fica à espera de nova tentativa em vez de mostrar outra cena.

A Revisão verifica o ID, a localização e o estado do panorama antes de liberar o mapa de resposta e iniciar a contagem do tempo. Se a imagem continuar preta, o tempo pode avançar; recarregue a página para tentar novamente.

Use **Salvar** para aplicar. Rigor e intervalos afetam o agendamento futuro sem reescrever tentativas salvas; limites e ordem entram no próximo cálculo da fila.

Revisão salva a resposta, o agendamento, a fila restante, as estatísticas dos cartões concluídos e o resultado antes de exibi-lo. Ao reabrir o mesmo site no mesmo perfil do navegador, você retoma a posição (por exemplo, cartão 90 de 150), incluindo um resultado aberto. Continuar avança sem avaliar novamente. Jogo também salva o tempo ativo durante a rodada, inclusive sem limite de tempo; o tempo com o aplicativo fechado não conta. O progresso salvo permanece após uma desconexão, mas o Street View precisa de internet. Se uma panorâmica falhar, o cartão continua disponível para tentar novamente. A sincronização permanece manual. Apagar os dados do site ou usar um perfil temporário pode remover o progresso local; mantenha um backup portátil para recuperá-lo.

## Coach de IA e pistas

Quando a estimativa do país principal chega a 85%, o Coach procura um local mais específico. Duas pistas visíveis independentes podem sustentar uma área geográfica ampla (como o Meio-Oeste) ou uma região definida; uma cidade ou local exato exige provas mais fortes. Uma porcentagem alta para o país não identifica, por si só, a região. Sem provas suficientes na imagem, o Coach omite a estimativa regional.

Em **Configurações → Coach de IA**, você pode escolher Gemini, Anthropic ou um provedor compatível com OpenAI, definir o modelo e colar sua própria chave de API. A chave fica oculta, permanece apenas na memória da página e é enviada pelo serviço do Coach em cada análise; o GeoTrainer não a salva. Use **Esquecer chave** ou recarregue a página para apagá-la. O provedor aplica os próprios limites de uso e cobranças. URLs compatíveis com OpenAI são limitadas a provedores públicos aceitos.

Curta, Normal e Profunda também ajustam o orçamento de raciocínio do Gemini 2.5 e o nível de detalhe visível; os modelos Gemini 3 usam os níveis de raciocínio correspondentes.

Jogo fixa o uso de IA quando você envia a resposta. Analisar um erro depois, mesmo com o resultado minimizado ou enquanto a resposta ainda é salva, não altera essa tentativa. Restaurar uma análise antiga não conta como novo uso de IA durante a rodada.

As marcações antigas de Jogo são corrigidas automaticamente quando uma imagem pessoal do Caderno foi guardada durante a rodada e não há análise de IA registrada. As análises de pistas e de 360° mantêm a marcação de assistência. Registros antigos ambíguos ficam inalterados; pontuações, respostas, notas e agendamentos de Revisão são preservados.

Jogo usa a mesma barra de aprendizagem de Estudo: Caderno, contagem de notas disponíveis próximas e Coach de IA quando ativado na configuração da partida.

O Coach aguarda o idioma de IA salvo antes da análise, rejeita resultados claramente multilíngues e explica as pistas visíveis por trás de cada novo país candidato.

Analisar reúne automaticamente várias direções e usa a vista atual como alternativa. Só mostra uma estimativa de região, cidade ou local exato quando várias pistas visuais fortes a sustentam. Após revelar a resposta, **Analisar** vira **Explicar**: usa apenas referências do país correto e admite quando a imagem não bastava para identificá-lo. Pistas abre uma biblioteca com detalhes completos, Street View e links do Google Maps; o filtro mostra o total por país, ordena do maior para o menor e × o limpa. Em Jogar e Revisar, minimizar o resultado mostra **Analisar** sem o contexto da resposta salva; mostrar o resultado novamente restaura **Explicar**.

Em **Pistas → Países**, selecione um cabeçalho para ordenar por país, pistas salvas, confiança média do Coach ou atividade mais recente. Selecione novamente para inverter a ordem. Inicialmente, os países com mais pistas aparecem primeiro.

As lições Meta salvas explicitamente, tanto do curso inicial como dos cursos por país, aparecem em Minhas pistas com texto, imagem de referência quando disponível e horário exato do salvamento.

### Capturar, colar e analisar uma pista

1. Enquadre a pista e pressione **Print Screen** ou **Windows + Shift + S** para copiar uma captura.
2. Abra **Coach de IA → Pistas conhecidas**, selecione a área da pista e pressione **Ctrl + V** (ou **Command + V** no macOS).
3. Confira a prévia e escolha **Analisar pista**.
4. O GeoTrainer salva automaticamente a imagem, as evidências e a nota de estudo em **Pistas**. Antes do palpite na Revisão, a análise não revela a resposta.

Quando o recorte tem um objeto principal claro em primeiro plano, o Coach o analisa primeiro e usa o entorno como contexto de apoio ou contradição. Detalhes ilegíveis permanecem explicitamente incertos.

### Usar uma resposta de IA externa no Caderno

1. Capture ou copie a imagem da pista.
2. Abra o Gemini ou outra interface externa de IA do Google e anexe ou cole a imagem.
3. Comece com: **“Você é um coach de GeoGuessr.”** Peça as evidências visíveis, os principais países que podem ser confundidos e a pista que os separaria.
4. Copie a resposta e cole no campo de texto do **Caderno**.
5. Salve a nota para Revisão.

O Caderno preserva títulos, negrito e listas com marcadores ao colar. Respostas externas não são verificadas automaticamente; mantenha detalhes ilegíveis como incertos e confira cada afirmação com o que realmente aparece.

## Coleções e preferências

Os mapas reabrem mais rapidamente durante uma sessão em Aprender, Jogar, Revisar e nos resultados de localização. Colocar ou arrastar um marcador mantém o mapa na posição escolhida. Ao recarregar a página, pode ser necessário baixar as imagens do mapa; áreas já vistas não têm disponibilidade garantida sem conexão.

Em Configurações → Exibição → Mapas, **Paleta de cores do mapa** oferece Automático, Claro ou Escuro. **Zoom do mapa de resultados** oferece Mais próximo, País, Região do país ou Mundo; País é o padrão. Automático acompanha a aparência do aplicativo; Claro usa as cores originais do Google nos mapas rodoviários e de relevo, enquanto Escuro mantém uma paleta escura mesmo se o tema do aplicativo mudar. Imagens de satélite mantêm suas cores.

Em um mapa com a resposta revelada, use o botão de mira para aproximar o local correto, o de edifício para ver a cidade ou o de globo para voltar à escala do país. Você ainda pode ampliar e mover o mapa; a opção nas Configurações define apenas a vista inicial.

As fronteiras nacionais aparecem por padrão e podem ser ocultadas; só aparecem quando há uma fronteira na área visível do mapa. A espessura e a cor das fronteiras podem ser ajustadas com uma prévia ao vivo; as fronteiras regionais ficam desativadas por padrão e podem ser ativadas separadamente.

Países, cidades e ambientes orientam a geração, sem prometer cobertura completa. Preferências separam idiomas da interface, jogo e IA, além de limites de revisão, fuso horário, aparência e auxílios do mapa. Perfis novos usam 50 cartões novos e 500 revisões por dia. Efeitos e música ambiente são opcionais, começam desligados e têm volumes separados. Com os efeitos ligados, o Jogo cronometrado toca nos últimos dez segundos e ao esgotar o tempo. A música muda de um ritmo calmo em Aprender para outro mais urgente no Jogo e pausa quando a página fica oculta.

O idioma da Wikipédia é escolhido separadamente para os links de lugares revelados em Aprender, Jogar e Revisar. Se não houver um artigo correspondente nesse idioma, a busca usa a Wikipédia em inglês. Se também não houver resultado, o nome fica sem link. Perfis existentes começam com inglês. Nomes de ruas revelados também recebem links quando existe um artigo correspondente; caso contrário, ficam como texto.

### Metas de pontuação por país

Abra Configurações → Preferências → Metas de pontuação por país. Mantenha o mínimo padrão para preservar a exigência atual da Revisão. Escolha um país no menu, informe um mínimo de até 5.000, selecione Adicionar meta e depois Salvar. O lápis edita e × remove a meta. Nomes e números seguem o idioma da interface.

Errar o país sempre conta como erro de treino. Com o país correto, pontuar abaixo do mínimo também falha; igualar o mínimo cumpre a meta. A meta do país substitui a meta padrão, mas regras mais exigentes de avaliação e revisão automática continuam valendo. Sem uma meta própria, os países mantêm o padrão e as regras existentes. Mudar o padrão afeta os países sem metas próprias; restaure-o para voltar à exigência atual da Revisão.

No Jogo e na Revisão, um palpite na água a até 25 km da resposta é atribuído ao país correto quando o mapa não identifica nenhum país. Perto de ilhas isoladas como Guam, as Ilhas Marianas do Norte e a Ilha Christmas, isso também corrige um rótulo de território continental distante. Os pontos por distância e as metas de pontuação continuam valendo; um palpite em terra de outro país permanece incorreto.

Na Revisão, um palpite no país correto a até 25 km dessas ilhas avança o cartão com a avaliação Difícil mesmo que a pontuação fique abaixo da meta. Os pontos e a meta salva não mudam; o cartão volta mais cedo para treinar a precisão.

Jogo adiciona automaticamente à Revisão as rodadas abaixo da meta. Praticar erros usa as metas salvas também em jogos antigos. Revisão e correção de erros exigem outra tentativa abaixo do mínimo. Salvar metas não altera pontos, respostas, estatísticas de reconhecimento de países, tentativas originais ou agendamentos existentes; respostas novas usam as metas atualizadas. Não há verificação de limites de cidades ou regiões.


## Progresso e estatísticas

Os totais de panoramas, tentativas e tempo ativo da página inicial vêm do progresso salvo neste dispositivo. Pontos aparecem durante o carregamento; não é preciso sincronizar a conta para vê-los.

Estatísticas e Cobertura formatam nomes de países, datas e números no idioma de interface selecionado, em vez da localidade padrão do navegador. A tabela de países separa locais panorâmicos únicos de tentativas pontuadas; tentativas, acertos, erros, precisão e pontuações combinam Jogo e Revisão.
 A coluna **Locais únicos** agrupa panoramas do mesmo país a até 50 metros como um único local; o mapa e o histórico mantêm todos os panoramas e tentativas. Enviar um mapa não marca seus locais como vistos até que sejam abertos.

Locais salvos no Estudo são fontes sem nota: contam como atividade de Estudo e cartões novos, não como tentativas «Sem palpite» ou pontuações zero. Recarregar retoma a visita atual sem criar outra linha.

Veja lugares, tentativas, fila, desempenho, histórico e o tempo ativo em primeiro plano durante Estudo, Jogo ativo e Revisão ativa, incluindo movimento pelos panoramas e uso de recursos de aprendizagem. Desempenho, Geografia, Progresso e Confusões combinam tentativas de Jogo e Revisão; a caixa de IA afeta apenas o Jogo. O tempo oculto ou fechado não aumenta novas durações de resposta. O tempo é salvo ao trocar de seção ou voltar ao Início; sessões sem visitas nem tentativas ficam ocultas.

Em uma tela sensível ao toque, mantenha pressionada uma barra de **Próximos pendentes** para ver a data e a quantidade. Pistas conhecidas soma entradas pessoais, de IA e Meta sem duplicar a imagem de uma nota. Rodadas com IA entram por padrão e podem ser excluídas. O resumo separa média anterior e de hoje; o calendário colore a atividade. Locais do mesmo país a até 50 metros compartilham um cartão.

Em Estatísticas → Revisões, **Equilibrar datas** mostra uma prévia dos próximos 30 dias. Passe o cursor, selecione ou toque numa barra para ver a quantidade exata. Ao confirmar, apenas cartões futuros mudam dentro de uma pequena parte do seu intervalo. Cartões pendentes hoje e etapas curtas de aprendizagem não mudam. Respostas e notas anteriores são preservadas. O controle de intensidade atualiza a prévia imediatamente: mova-o para a esquerda para manter mais datas ou para a direita para preencher mais os dias leves. Em 0%, nenhum cartão muda de data. Os mesmos limites de intervalo continuam valendo. Na mesma prévia, use Restaurar datas originais para devolver os cartões equilibrados elegíveis às datas naturais salvas e depois confirme. Os cartões pendentes hoje também permanecem no lugar.
 O tempo ativo da Revisão pausa enquanto o resultado está aberto e continua ao minimizá-lo ou avançar. O Coach oferece Analisar com o resultado oculto e Explicar quando ele aparece.

No Histórico, selecione uma linha de lugar para abrir o panorama salvo com Coach, Caderno, Meta e Notas disponíveis. O botão de voltar retorna ao Histórico. A seta externa continua abrindo o Google Maps; o botão de Revisão inicia uma revisão com pontuação. Abrir um lugar não altera tentativas anteriores.

## Sincronização na nuvem

Se o acesso à nuvem estiver indisponível, a janela da conta oculta os controles de login. O treino local e as ferramentas de exportar e importar backups continuam disponíveis.

A conta é opcional e o treino local funciona sem login. O progresso é salvo primeiro neste navegador e a sincronização é manual. Pressione **Sincronizar agora** no dispositivo com trabalho novo para baixar, combinar e enviar cartões, tentativas e histórico de Revisão; depois faça o mesmo nos outros dispositivos. Vence o agendamento avaliado mais recentemente, e os registros exclusivos de cada dispositivo são preservados. Entrar, salvar, voltar ao app ou sair não transfere dados automaticamente. Sem login, localhost e o site publicado ficam separados.

As imagens privadas ausentes são armazenadas neste navegador durante a sincronização manual. Abrir Pistas, Notas disponíveis, Cobertura ou o histórico usa essa cópia local e não consulta o armazenamento na nuvem.

A sincronização usa menos dados sem perder o progresso salvo. Os arquivos `.geotrainer` exportados são compactados, mas continuam incluindo todos os registros locais e as fotos salvas. Arquivos antigos também podem ser importados.

**Sincronizar e fazer backup** também oferece **Exportar** e **Importar** sem precisar da nuvem. Exportar baixa um arquivo `.geotrainer` com toda a base local e as fotos salvas neste dispositivo. Importar valida o arquivo e combina apenas informações ausentes ou mais recentes sem apagar o progresso local. O arquivo registra o identificador da conta exportadora; uma conta diferente ou a ausência de login exige confirmação. Mantenha o arquivo privado e transfira-o pelo Drive, OneDrive, USB ou outro local confiável.

## Solução de problemas

Se a Revisão deixar de mostrar cartões após uma falha ou recarga, confira primeiro se você abriu o mesmo endereço do site e o mesmo perfil do navegador. Não apague os dados do site. Em **Sincronizar e fazer backup → Importar**, escolha o arquivo `.geotrainer` mais recente; ele será combinado com o progresso ainda presente neste dispositivo. Se você sincronizou manualmente um trabalho mais recente, use **Sincronizar agora** para recuperar essa cópia da nuvem. O trabalho feito após a última exportação ou sincronização manual talvez não possa ser recuperado.

1. Panorama vazio — avance; a cobertura do Street View pode mudar.
2. Controles sobre uma tela preta — teste o Street View no Google Maps com o mesmo navegador. Se a imagem também ficar preta, abra o GeoTrainer em uma janela privada sem extensões, altere a aceleração gráfica do navegador e reinicie-o. Atualize o navegador e o driver gráfico se necessário. Se apenas o GeoTrainer falhar, recarregue-o uma vez e informe o navegador, o dispositivo e as extensões ativas ao relatar o problema.
3. Revisão vazia — jogue ou salve um local do Estudo e espere vencer.
4. IA indisponível — continue treinando e tente mais tarde.
5. Progresso antigo — confira a conta e pressione **Sincronizar agora** em cada dispositivo, começando pelo que contém o trabalho novo.

## Sugestões e relatos de erros

Envie sugestões ou relatos de erros para [mogatas.princealjohn.05082003@gmail.com](mailto:mogatas.princealjohn.05082003@gmail.com). Ao relatar um erro, inclua o navegador, o dispositivo, o que estava fazendo e uma captura de tela quando possível.

## Perguntas frequentes

1. Preciso de conta? — Não, somente para sincronizar.
2. Estudo muda a pontuação? — Não.
3. Posso avaliar manualmente? — Não; o resultado geográfico decide.
4. Prática extra adia cartões? — Não; cartões futuros não mudam e os já vencidos avançam quando concluídos.
5. Cobertura inclui todos os lugares? — Não, apenas os visitados.

## Recursos de aprendizagem

Combine faixas viárias, mão de direção, alfabetos, postes, relevo, arquitetura, vegetação, câmera e clima. Prefira várias pistas coerentes e registre contradições.

### Referências externas

- [Plonk It](https://www.plonkit.net/) — guias estruturados por países, regiões, mapas e prática.
- [GeoHints](https://geohints.com/) — catálogo visual de balizadores, linhas, placas, sinais, postes, câmeras e outras pistas.
- [GeoMetas](https://geometas.com/) — lições gratuitas de metas por país, região e categoria, com quizzes dinâmicos.
- [Learnable Meta](https://learnablemeta.com/) — mapas de aprendizagem do GeoGuessr, documentação e recursos para criar mapas.

## Aprender, Meta e Caderno

As lições Meta usam referências externas: o texto do curso para iniciantes baseia-se no [GeoMetas](https://geometas.com/), e o texto e as imagens dos cursos por país vêm do [Plonk It](https://www.plonkit.net/guide). O GeoTrainer é independente desses guias. Cada lição mostra a sua referência; consulte o original para ver atualizações, pois a cobertura do Street View e as pistas visuais podem mudar.

Nas lições para iniciantes, a pista mostrada na imagem vem primeiro; quando há uma comparação com outro país, ela aparece abaixo. Os infográficos de referência dos cursos por país aparecem dentro da lição e do detalhe Meta salvo, junto da explicação. Se um panorama Meta salvo expirar, o GeoTrainer procura Street View oficial ao ar livre em até 50 metros; mantém a vista original quando ainda estiver disponível, mesmo que seja de um colaborador.

Salvar explicitamente uma entrada do Caderno cria ou reutiliza um novo cartão de Revisão mesmo após uma rodada de Jogo com pontuação alta e país correto. Uma pista salva pode ensinar uma região, cidade, estrada ou outro detalhe além do país.

Imagens coladas, enviadas ou capturadas no Caderno podem ser recortadas antes da análise ou do salvamento. Use o controle de edição no canto inferior direito da prévia, arraste a área ou os cantos e aplique o recorte.

Depois de salvar uma nota de texto ou a análise de uma pista colada, um aviso confirma que ela está no Caderno.

A **câmera 360°** no espaço de trabalho copia quatro direções do panorama atual como uma única imagem. Uma notificação mostra o progresso e confirma se a cópia foi concluída. A imagem vai diretamente para a área de transferência e não é salva no GeoTrainer.

Aprender tem quatro caminhos. **Personalizado** mantém coleções e ambientes. **Meta** abre lições guiadas no panorama e direção registrados. **Explorar mapa** mostra a cobertura do Street View. Os filtros no canto inferior esquerdo escolhem imagens oficiais, mistas ou de colaboradores e cobertura somente externa ou mista. Em Meta e no mapa, Revelar abre o cartão normal, onde Salvar para revisão agenda a prática de localização.

Em qualquer caminho de Aprender, o mapa do cartão revelado mostra a cobertura azul do Street View por padrão. Clique numa área coberta para abri-la em Explorar mapa ou use o botão de camadas para ocultar a cobertura e desativar a seleção nessa vista. Isso não avança o mapa carregado nem uma lição Meta. O mapa mantém o zoom e a posição após selecionar a cobertura. Se Somente oficiais não encontrar nada, a mensagem pede para escolher **Oficiais + colaboradores** abaixo; ela nunca muda esse filtro por você. A seta de voltar no canto superior esquerdo retorna ao panorama de Aprender, ao panorama carregado ou à lição Meta de origem; se você abriu Explorar mapa diretamente, o botão de globo volta ao mapa-múndi.

O panorama aberto pela cobertura já aparece revelado, com o cartão do local visível. Se veio de um mapa JSON enviado, a seta de voltar no canto superior esquerdo retorna diretamente ao panorama exato de origem sem avançar o progresso da fonte; nos outros casos, o globo abre o mapa-múndi.

Aprender personalizado e Jogo usam imagens oficiais do Google por padrão; o seletor permite misturar panoramas oficiais e de colaboradores ou solicitar somente panoramas de colaboradores. **Permitir interiores** fica desativado por padrão nas duas configurações; quando ativado, o Google pode retornar cobertura interna e externa do Street View.

Em **Configurações → Exibição**, você pode controlar nomes de ruas, data da imagem, movimento do telefone, modo de deslocamento, tipo de mapa, gestos, locais clicáveis e cores do GeoTrainer. Nomes de ruas e locais clicáveis começam desativados para evitar pistas acidentais.

Ative os nomes de ruas quando quiser aprender como ruas e estradas são nomeadas em lugares diferentes. Os nomes também podem revelar onde você está; desative-os novamente quando quiser adivinhar sem essa pista.

A lâmpada no canto superior direito alterna a explicação. O aviso inicial pode ser fechado uma vez ou ocultado definitivamente sem remover lições. Um Meta só entra em **Minhas pistas** quando sua localização é salva explicitamente para revisão. Na Revisão, o painel Meta fica oculto por padrão; abra-o para ler todo o conteúdo.

No Estudo Meta, cada novo panorama deixa a explicação atrás da lâmpada no canto superior direito. Toque nela para ver a imagem de referência e as notas. Em Configurações → Exibição → Meta, ative a abertura automática se quiser ver cada lição imediatamente. Na Revisão, o painel Meta continua fechado até você abri-lo.

Meta oferece um curso para iniciantes e 131 cursos por país. As lições abrem o panorama voltado para a pista. Se o Google o substituiu, uma nova vista a até 50 metros pode ser aberta na mesma direção. Panoramas indisponíveis são ignorados sem marcar a lição como vista; se nenhum restar, você volta à configuração. uma imagem local de exemplo aparece quando existe. O painel Meta da Revisão fica oculto por padrão; abra-o para ler todo o conteúdo. Avançar marca a lição como vista e atualiza o progresso mesmo sem Salvar para revisão. Anterior volta à lição anterior, e o contador mostra 1/N. Meta serve para estudar pistas, sem ciclo de dois palpites nem cartão de Revisão automático por distância.

Os 29 cursos temáticos do GeoCoach reúnem 947 lições sobre placas, marcas viárias, carros, idiomas e pistas regionais. As explicações e os links dos panoramas escolhidos ficam incluídos no GeoTrainer; durante a lição, não é preciso acessar a API do GeoCoach. Cada lição liga ao mapa original e credita seu criador. Vistas indisponíveis são ignoradas pela mesma regra do Meta. Um espaço de carregamento aparece enquanto uma imagem de referência Meta é aberta.

Quando o GeoCoach fornece uma foto da pista, ela aparece na lição, na lista de lições e nos detalhes salvos. Lições sem foto de origem continuam mostrando o panorama e a explicação.

Os cursos para iniciantes e por tema têm miniaturas locais, e o nome do curso ativo aparece na barra de Aprender. Selecione uma imagem de referência Meta para ampliá-la; feche com X ou Escape. No cartão de localização revelada, o nome do lugar abre a Wikipédia quando a pesquisa encontra resultados; caso contrário, permanece como texto e aparece um aviso.

 No curso para iniciantes, Avançar abre outra lição pendente e Anterior volta a uma lição visitada anteriormente, mesmo após recarregar; quando não restam lições, você volta à escolha do curso; nos cursos por país, avança dentro do país.  Pesquise cursos temáticos e por país; ordene os cursos por país pelo nome, número de lições ou progresso. Começar de novo abre a escolha do modo de estudo; Retomar mantém a lição salva. Todas as lições por país agora mostram sua imagem de referência deste site.
Escolha o curso para iniciantes, um tema ou um país no seletor; cada curso mostra sua porcentagem de conclusão. **Começar a aprender** abre uma lição pendente do curso selecionado, considerando o progresso salvo. **Explorar lições Meta** abre a lista se você quiser uma lição específica; pesquise o texto e filtre entre todas, pendentes ou concluídas. Escolha qualquer lição, inclusive uma concluída, e use **Iniciar lição selecionada** para abri-la. Reabrir uma lição concluída mantém seu estado e não agenda um cartão de Revisão. O conteúdo do curso usa o idioma da interface, independentemente dos idiomas do jogo e da IA.

O **Caderno** guarda quantas notas pessoais quiser por panorama. Categoria e texto são opcionais; uma entrada vazia também pode salvar o local para revisão. Também aceita imagens analisadas pelo Coach. Você pode escrever e salvar uma nova nota durante a revisão; a análise da imagem não revela a resposta antes do palpite. Entradas pessoais, de IA e Meta abrem uma vista detalhada com Street View e uma imagem sobreposta quando disponível.

Nos detalhes de uma pista visual salva, você pode adicionar ou editar a nota, salvá-la e abrir a imagem em tela cheia. Imagens idênticas só são combinadas quando a nota ou descrição também coincide ou está vazia; textos úteis diferentes permanecem separados. **Notas disponíveis** mostra um contador e todo o histórico rolável; novas análises do Coach entram ali imediatamente e não reabrem como resultado ativo após recarregar.

Minhas pistas filtra **Pessoal**, **Com ajuda de IA** e **Lições Meta** e pagina 20 resultados correspondentes por vez; texto revelador fica oculto antes da resposta.

Cada entrada de Notas disponíveis tem uma lixeira discreta. Entradas com o mesmo texto normalizado ou a mesma imagem exata são agrupadas automaticamente, mantendo a versão mais completa com imagem e descrição.

Cada salvamento do Caderno permanece uma entrada independente, mesmo no mesmo panorama. Se uma foto enviada não puder ser carregada, a nota continua visível e é marcada para recuperação.

Um resultado baixo volta automaticamente ao fim da sessão de revisão atual até você acertar, mesmo após recarregar a sessão ativa. Cada tentativa permanece registrada separadamente, e o acerto posterior avança o cartão em vez de deixá-lo imediatamente pendente.

**Notas disponíveis** contém o histórico Pessoal e assistido por IA do panorama e de nós do Street View no mesmo país a até 50 metros, com análise completa, horário exato e a captura enviada quando existir; Meta permanece na própria lâmpada. O Coach aguarda a preferência de idioma salva e solicita todos os valores em linguagem natural no idioma de IA escolhido. Texto pessoal e de IA finalizado mantém o idioma de criação. Revisar um cartão já pendente avança seu agendamento mesmo pela prática personalizada e persiste após recarregar.


Uma sessão de Estudo ou Jogo inacabada fica preservada. Ao voltar, escolha **Retomar**, **Começar de novo** ou **Voltar**. A cobertura inclui um mapa de calor contínuo de **Domínio**: muitas revisões bem-sucedidas e intervalos longos iluminam gradualmente países e locais, enquanto erros reduzem a intensidade. Um panorama aberto da Cobertura oferece Coach de IA, Caderno, Meta vinculada e Notas disponíveis; salvar cria ou reutiliza seu cartão de Revisão. Pistas Meta dependentes da imagem mostram um aviso porque atualizações do Street View podem torná-las desatualizadas.

Na Cobertura, arraste o mapa de calor por país e use a roda do mouse, o controle deslizante ou os botões para ajustar o zoom. Em Exposição, as cores distinguem melhor as contagens baixas de encontros e mantêm uma referência superior fixa. Clique em um país para abrir seu mapa regional com a mesma camada. As regiões são identificadas pelos dados salvos do local ou pelo Google Maps ao abrir o mapa. Alguns países não têm mapa regional; locais sem região identificada ficam sem cor.

## Estilos e profundidade do Coach de IA

Em **Configurações → Coach de IA**, escolha **Sempre perguntar antes da análise** ou um estilo preferido. A profundidade Curta, Normal ou Profunda é independente e muda o detalhe, não o método. Não há Adaptive nem troca automática.

- **⚡ Quick Guess:** países prováveis, probabilidade relativa, pistas visíveis principais e confiança. É rápido durante o jogo, mas ensina menos.
- **🎯 Meta Coach:** classifica postes, balizadores, linhas, placas, sinais, carro do Google e cobertura por nível S–D, função, confiabilidade e confusores. É ideal para No Move, embora algumas metas mudem.
- **🚫 Elimination Coach:** mostra candidatos, evidências contrárias, opções ainda plausíveis e a melhor pista para separá-las. Reduz ancoragem e evita “impossível” quando há exceções.
- **🌍 Deep Geography:** segue o que é → função → causa → resposta humana → resultado visível → valor no GeoGuessr. Constrói intuição causal, mas declara quando a imagem não sustenta história, economia ou geologia.
- **🧠 Memory Coach:** cria âncoras verdadeiras, causa e efeito, contrastes, contrapistas e perguntas de memória. Ajuda a retenção sem transformar simplificações em absolutos.
- **🏆 Pro Analyst:** pondera evidências positivas e negativas, contradições, independência, pistas fracas, incerteza e ganho de informação. É ótimo em casos próximos, mas percentuais são estimativas de IA.

Todos usam as mesmas observações e separam observado, inferido e especulativo. Cada candidato explica a característica concreta, se é nacional ou regional, o principal confusor, o que os separa e qual pista aumentaria mais a confiança. Siglas, organizações, cultivos, história, geologia, indústrias e regras não são inventados.
Durante uma Revisão ativa, o cabeçalho mostra o cartão atual, os cartões restantes e que o progresso foi salvo. Recarregar preserva a contagem de cartões já concluídos.

O mapa do resultado mantém a resposta verde centralizada e afasta o zoom até mostrar o palpite vermelho de hoje e todos os palpites anteriores com coordenadas em azul. O zoom escolhido é a escala mais próxima permitida.
