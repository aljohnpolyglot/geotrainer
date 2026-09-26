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

Aprender oferece quatro opções: Personalizado, Meta, Explorar mapa e Mapa enviado. Em Mapa enviado, selecione um JSON do Map Maker com uma lista de locais ou `customCoordinates`; cada local precisa de latitude e longitude válidas. O arquivo deve ter menos de 20 MB. Anterior fica antes de Revelar e é ativado depois de visitar dois locais. Próximo avança primeiro pelos locais já vistos e depois escolhe um novo. O X à direita do cabeçalho abre a escolha do modo. O mapa fica neste dispositivo; envie-o novamente em outro dispositivo para continuar. A variação 0 mantém a vista enviada; 100 procura Street View até 1 km ao redor e volta a um local original quando necessário. O botão de menos minimiza a ficha do local e maximizar a expande para toda a tela.

### Escolher uma prioridade de aprendizagem

O aprendizado com mapa enviado identifica o progresso da fonte (por exemplo, **Fonte: 1/50**). Cada entrada é marcada como concluída ao ser verificada, portanto **Próximo** não pode escolhê-la novamente mesmo que uma variação próxima abra outro panorama; entradas quebradas também são ignoradas uma única vez. Ao concluir, **Próximo** desaparece e resta **Anterior**. O Jogo também não repete entradas da fonte. Em Explorar mapa, pesquise uma cidade, região ou país e escolha uma sugestão do catálogo integrado do GeoTrainer para aproximar o mapa. As sugestões apenas movem o mapa de cobertura; clique na cobertura azul para abrir o Street View. O texto pessoal do Caderno aceita até 1000 caracteres por salvamento e mostra um contador abaixo do editor.

A prioridade muda como os **novos locais do Aprendizado personalizado** são escolhidos depois da coleção, mistura de países, ambiente, fonte das imagens e filtro de interiores. Ela não altera Mapa enviado, Meta, Explorar mapa, Jogo ou Revisão.

- **Aleatório** (padrão) seleciona no conjunto elegível sem usar seu histórico. No Mundo, reduz o peso de territórios muito pequenos para que não dominem. Use para obter variedade ou percorrer amplamente a coleção.
- **Locais familiares** escolhe um local elegível já encontrado como ponto de partida e procura aproximadamente entre 1 e 12 km ao redor dele. Use para aprender os arredores e reconhecer vistas próximas sem repetir o panorama exato.
- **Menor exposição** escolhe primeiro um país elegível ainda não visto ou com menos encontros, preenche as regiões incluídas que ainda aparecem em cinza na Cobertura e depois mira a maior lacuna geográfica restante. Essa etapa regional também vale para coleções de um único país; regiões sem um ponto local utilizável voltam à busca de lacunas no país inteiro.

Quando não há histórico elegível, Locais familiares e Menor exposição começam no conjunto selecionado como Aleatório. Em uma busca de Menor exposição com vários países, o GeoTrainer tenta primeiro o país cinza ou menos visitado escolhido e seu alvo regional. Cada busca sem um panorama válido, inclusive quando ele aparece fora do país solicitado, avança imediatamente. Se um país nunca visto falhar, os países com cobertura já comprovada são tentados da menor para a maior exposição antes de outros países desconhecidos; empates são embaralhados. A ordem se repete até encontrar um panorama ou até você sair. A cobertura do Street View e os filtros ativos ainda determinam se a área alvo pode fornecer um panorama; uma vista disponível próxima pode ser usada quando o ponto exato não tem cobertura.

Em Mundo com Menor exposição, uma verificação de cobertura incluída ignora países cujos pontos não encontraram panoramas oficiais navegáveis. Conjuntos focados continuam pesquisando todos os países selecionados.

Estudo é um primeiro contato sem nota. Escolha a coleção inteira, um país-alvo ou uma mistura de países que você costuma confundir; cada país aparece como uma pílula com bandeira removível. Salvar uma pista cria automaticamente um cartão reutilizável de Revisão sem inventar pontuação. O local atual permanece aberto após o salvamento; use Próximo quando quiser avançar. O estado salvo é restaurado após recarregar, então a ação não reaparece.

Use os menus separados **Regiões** e **Cidades** e remova seleções pelas pílulas. As regiões são agrupadas por país e as cidades por região. Sem regiões selecionadas, vale o conjunto normal do país inteiro. Sem cidades selecionadas numa região, todas as disponíveis são incluídas; escolher cidades restringe apenas essa região. Remover uma região remove suas cidades; remover a última cidade restaura todas as disponíveis. Depois de adicionar países, você pode adicionar regiões e cidades como pílulas independentes. As regiões aparecem em ordem alfabética; as cidades usam por padrão a importância pela população e também podem ser ordenadas alfabeticamente. **Todas as cidades disponíveis** usa os pontos de cidades incluídos na região; não representa todo o polígono administrativo nem garante cada estrada ou área rural. Ao abrir uma nova configuração de Aprender após sair de uma sessão focada, World e a lista completa de países são restaurados; Retomar mantém a sessão salva. Menor exposição procura primeiro no ponto escolhido e depois amplia a busca local. Em Misto, novas tentativas usam pontos de cobertura do país e mantêm os filtros. A busca continua tentando em ritmo moderado até encontrar uma correspondência ou até você sair ou alterar a configuração; não há garantia de cobertura no ponto exato.

Os nomes das regiões e cidades seguem o idioma da interface quando há um nome localizado disponível. **Salvar conjunto geográfico** baixa as escolhas atuais de países, regiões e cidades como JSON, sem coordenadas do Street View. **Enviar JSON** e **URL JSON** aceitam esse formato editável ou um JSON de coordenadas do Map Maker; um conjunto geográfico volta para Personalizado para edição, enquanto as coordenadas permanecem como uma fonte finita. O nome do arquivo ou da URL é exibido. O endpoint precisa permitir acesso pelo navegador (CORS).

**Descrever um conjunto** envia um pedido curto ao Gemini e abre os países, regiões e cidades sugeridos em Personalizado para você revisar e editar. Você pode escrever em qualquer idioma compatível e descrever lugares, paisagens ou confusões comuns. É uma sugestão de IA, não uma garantia geográfica.

## Modo Jogo

Na configuração do Jogo, escolha Locais gerados ou Mapa enviado. As rodadas do mapa enviado usam seus locais e podem repeti-los se houver menos locais que rodadas.

Jogo usa a mesma mistura de países e mede a recordação sem ajuda em 1–100 rodadas. Cada palpite vira uma nova tentativa e salva a vista atual para prévias.

## Revisão e agendamento

A resposta fica oculta até o palpite. Se um ID antigo abrir um panorama a mais de 10 km da resposta salva, a Revisão usa uma vista válida perto das coordenadas salvas ou não abre o cartão. Depois da resposta, o resultado mostra cidade, região, via, endereço completo e coordenadas disponíveis, como Revelar no Estudo. Minimize o resultado no canto superior direito para estudar o panorama e use Ver resultado para abri-lo novamente. A prática personalizada não altera cartões futuros; concluir um cartão já vencido avança sua data e persiste após recarregar.

### Personalizar a revisão

- **Novos cartões / dia** limita cartões nunca revisados. **Máximo de revisões / dia** limita toda a fila pronta, incluindo cartões novos e antigos. Os dois limites valem juntos. Com 50 novos e 500 revisões máximas, 110 cartões podem estar vencidos, mas só 108 prontos se dois novos excederem o limite. Início e Revisão mostram a quantidade realmente disponível; aumentar o máximo total não ignora o limite de novos cartões.
- **Rigor da avaliação** controla a nota automática: Iniciante tolera maior distância, Equilibrado combina país e precisão, e Pro exige resultado mais forte. País, distância, pontuação e tempo são considerados; não há botões manuais Novamente/Difícil/Bom/Fácil.
- **Adicionar rodadas de jogo à revisão** é separado da avaliação: uma rodada futura cria um cartão se a pontuação ficar abaixo do limite escolhido ou se o país estiver errado. Qualquer condição ativada basta; perfis novos começam no limite ativo de Difícil/Novamente (3.000 em Equilibrado).
- **Primeira revisão**, **etapa de reaprendizado**, **primeiro intervalo excelente** e **intervalo máximo** controlam o primeiro vencimento, o retorno após erro, a espera após um primeiro resultado excelente e o teto de cartões maduros.
- **Tempo máximo de resposta** influencia a fluência da avaliação, sem necessariamente criar contagem regressiva. **Ordem** escolhe mais antigos primeiro ou fila aleatória.
- **Hora de redefinição** e **fuso horário** definem o início do novo dia e a renovação dos limites. A detecção automática segue o dispositivo; desligue-a para escolher o fuso. A prévia mostra a próxima revisão real.
- **Variar vista de revisão** mantém o mesmo cartão e agenda, mas pode mudar a direção ou usar um panorama próximo em cartões maduros. Zero mantém a vista original; erros reduzem a variação e falhas de busca retornam à âncora sem duplicar cartões.

Use **Salvar** para aplicar. Rigor e intervalos afetam o agendamento futuro sem reescrever tentativas salvas; limites e ordem entram no próximo cálculo da fila.

## Coach de IA e pistas

Jogo usa a mesma barra de aprendizagem de Estudo: Caderno, contagem de notas disponíveis próximas e Coach de IA quando ativado na configuração da partida.

O Coach aguarda o idioma de IA salvo antes da análise, rejeita resultados claramente multilíngues e explica as pistas visíveis por trás de cada novo país candidato.

Analisar reúne automaticamente várias direções e usa a vista atual como alternativa. Só mostra uma estimativa de região, cidade ou local exato quando várias pistas visuais fortes a sustentam. Após revelar a resposta, **Analisar** vira **Explicar**: usa apenas referências do país correto e admite quando a imagem não bastava para identificá-lo. Pistas abre uma biblioteca com detalhes completos, Street View e links do Google Maps; o filtro mostra o total por país, ordena do maior para o menor e × o limpa.

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

Em Configurações → Exibição → Mapas, **Paleta de cores do mapa** oferece Automático, Claro ou Escuro. **Zoom do mapa de resultados** oferece Mais próximo, País, Região do país ou Mundo; País é o padrão. Automático acompanha a aparência do aplicativo; Claro ou Escuro mantêm a escolha nos mapas rodoviários e de relevo. Imagens de satélite mantêm suas cores. As fronteiras nacionais aparecem por padrão e podem ser ocultadas; só aparecem quando há uma fronteira na área visível do mapa. A espessura e a cor das fronteiras podem ser ajustadas com uma prévia ao vivo; as fronteiras regionais ficam desativadas por padrão e podem ser ativadas separadamente.

Países, cidades e ambientes orientam a geração, sem prometer cobertura completa. Preferências separam idiomas da interface, jogo e IA, além de limites de revisão, fuso horário, aparência e auxílios do mapa. Perfis novos usam 50 cartões novos e 500 revisões por dia. Efeitos e música ambiente são opcionais, começam desligados e têm volumes separados.

## Progresso e estatísticas

Locais salvos no Estudo são fontes sem nota: contam como atividade de Estudo e cartões novos, não como tentativas «Sem palpite» ou pontuações zero. Recarregar retoma a visita atual sem criar outra linha.

Veja lugares, tentativas, fila, desempenho, histórico e o tempo ativo em primeiro plano durante Estudo, Jogo ativo e Revisão ativa, incluindo movimento pelos panoramas e uso de recursos de aprendizagem. Desempenho, Geografia, Progresso e Confusões combinam tentativas de Jogo e Revisão; a caixa de IA afeta apenas o Jogo. O tempo oculto ou fechado não aumenta novas durações de resposta. O tempo é salvo ao trocar de seção ou voltar ao Início; sessões sem visitas nem tentativas ficam ocultas. Em uma tela sensível ao toque, mantenha pressionada uma barra de **Próximos pendentes** para ver a data e a quantidade. Pistas conhecidas soma entradas pessoais, de IA e Meta sem duplicar a imagem de uma nota. Rodadas com IA entram por padrão e podem ser excluídas. O resumo separa média anterior e de hoje; o calendário colore a atividade. Locais do mesmo país a até 50 metros compartilham um cartão.

## Sincronização na nuvem

A conta é opcional e o treino local funciona sem login. O progresso é salvo primeiro neste navegador e a sincronização é manual. Pressione **Sincronizar agora** no dispositivo com trabalho novo para baixar, combinar e enviar cartões, tentativas e histórico de Revisão; depois faça o mesmo nos outros dispositivos. Vence o agendamento avaliado mais recentemente, e os registros exclusivos de cada dispositivo são preservados. Entrar, salvar, voltar ao app ou sair não transfere dados automaticamente. Sem login, localhost e o site publicado ficam separados.

As imagens privadas ausentes são armazenadas neste navegador durante a sincronização manual. Abrir Pistas, Notas disponíveis, Cobertura ou o histórico usa essa cópia local e não consulta o armazenamento na nuvem.

**Sincronizar e fazer backup** também oferece **Exportar** e **Importar** sem precisar da nuvem. Exportar baixa um arquivo `.geotrainer` com toda a base local e as fotos salvas neste dispositivo. Importar valida o arquivo e combina apenas informações ausentes ou mais recentes sem apagar o progresso local. O arquivo registra o identificador da conta exportadora; uma conta diferente ou a ausência de login exige confirmação. Mantenha o arquivo privado e transfira-o pelo Drive, OneDrive, USB ou outro local confiável.

## Solução de problemas

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

Imagens coladas, enviadas ou capturadas no Caderno podem ser recortadas antes da análise ou do salvamento. Use o controle de edição no canto inferior direito da prévia, arraste a área ou os cantos e aplique o recorte.

Depois de salvar uma nota de texto ou a análise de uma pista colada, um aviso confirma que ela está no Caderno.

A **câmera 360°** no espaço de trabalho copia quatro direções do panorama atual como uma única imagem. Uma notificação mostra o progresso e confirma se a cópia foi concluída. A imagem vai diretamente para a área de transferência e não é salva no GeoTrainer.

Aprender tem quatro caminhos. **Personalizado** mantém coleções e ambientes. **Meta** abre lições guiadas no panorama e direção registrados. **Explorar mapa** mostra a cobertura do Street View. Os filtros no canto inferior esquerdo escolhem imagens oficiais, mistas ou de colaboradores e cobertura somente externa ou mista. Em Meta e no mapa, Revelar abre o cartão normal, onde Salvar para revisão agenda a prática de localização. Em Explorar mapa, clique na cobertura azul dentro do mapa desse cartão para ir a outro panorama; o mapa do cartão mantém o zoom e a posição. Se Somente oficiais não encontrar nada, a mensagem pede para escolher **Oficiais + colaboradores** abaixo; ela nunca muda esse filtro por você. Um botão de globo no canto superior esquerdo do panorama volta ao mapa-múndi sem ocupar o cabeçalho. Aprender personalizado e Jogo usam imagens oficiais do Google por padrão; o seletor permite misturar panoramas oficiais e de colaboradores ou solicitar somente panoramas de colaboradores. **Permitir interiores** fica desativado por padrão nas duas configurações; quando ativado, o Google pode retornar cobertura interna e externa do Street View. Em **Configurações → Exibição**, você pode controlar nomes de ruas, data da imagem, movimento do telefone, modo de deslocamento, tipo de mapa, gestos, locais clicáveis e cores do GeoTrainer. Nomes de ruas e locais clicáveis começam desativados para evitar pistas acidentais.

A lâmpada no canto superior direito alterna a explicação. O aviso inicial pode ser fechado uma vez ou ocultado definitivamente sem remover lições. Um Meta só entra em **Minhas pistas** quando sua localização é salva explicitamente para revisão. Na revisão, antes da resposta aparece apenas a imagem; o texto completo vem depois, e as ferramentas de aprendizagem continuam disponíveis até você escolher Próxima revisão.

O **Caderno** guarda quantas notas pessoais quiser por panorama. Categoria e texto são opcionais; uma entrada vazia também pode salvar o local para revisão. Também aceita imagens analisadas pelo Coach. Você pode escrever e salvar uma nova nota durante a revisão; a análise da imagem não revela a resposta antes do palpite. Entradas pessoais, de IA e Meta abrem uma vista detalhada com Street View e uma imagem sobreposta quando disponível. Nos detalhes de uma pista visual salva, você pode adicionar ou editar a nota, salvá-la e abrir a imagem em tela cheia. Imagens idênticas só são combinadas quando a nota ou descrição também coincide ou está vazia; textos úteis diferentes permanecem separados. **Notas disponíveis** mostra um contador e todo o histórico rolável; novas análises do Coach entram ali imediatamente e não reabrem como resultado ativo após recarregar. Minhas pistas filtra **Pessoal**, **Com ajuda de IA** e **Lições Meta** e pagina 20 resultados correspondentes por vez; texto revelador fica oculto antes da resposta.

Cada entrada de Notas disponíveis tem uma lixeira discreta. Entradas com o mesmo texto normalizado ou a mesma imagem exata são agrupadas automaticamente, mantendo a versão mais completa com imagem e descrição.

Cada salvamento do Caderno permanece uma entrada independente, mesmo no mesmo panorama. Se uma foto enviada não puder ser carregada, a nota continua visível e é marcada para recuperação.

Um resultado baixo volta automaticamente ao fim da sessão de revisão atual até você acertar. Cada tentativa permanece registrada separadamente.

O estudo Meta contém 359 lições hospedadas localmente, normalizadas da captura pareada do OpenGuessr e de exemplos adicionais do GeoMetas com coordenadas utilizáveis do Street View. As explicações Meta seguem o idioma da interface nos oito idiomas suportados. Usar o Coach de IA ou salvar uma entrada do Caderno cria ou reutiliza automaticamente o cartão de Revisão; caso contrário, o cartão de localização revelado mantém Salvar para revisão. **Notas disponíveis** contém o histórico Pessoal e assistido por IA do panorama e de nós do Street View no mesmo país a até 50 metros, com análise completa, horário exato e a captura enviada quando existir; Meta permanece na própria lâmpada. O Coach aguarda a preferência de idioma salva e solicita todos os valores em linguagem natural no idioma de IA escolhido. Texto pessoal e de IA finalizado mantém o idioma de criação. Revisar um cartão já pendente avança seu agendamento mesmo pela prática personalizada e persiste após recarregar.

Meta seleciona apenas lições não concluídas. Na configuração, **Geral** continua com uma lição pendente aleatória, enquanto **Explorar** pesquisa o catálogo traduzido e inicia a lição escolhida. Explorar pode mostrar todas, pendentes ou concluídas; as linhas concluídas ficam visualmente marcadas e não podem ser iniciadas novamente. Depois que as 359 forem concluídas, a opção em Aprender fica desativada e não pode mais ser escolhida.

Uma sessão de Estudo ou Jogo inacabada fica preservada. Ao voltar, escolha **Retomar**, **Começar de novo** ou **Voltar**. A cobertura inclui um mapa de calor contínuo de **Domínio**: muitas revisões bem-sucedidas e intervalos longos iluminam gradualmente países e locais, enquanto erros reduzem a intensidade. Um panorama aberto da Cobertura oferece Coach de IA, Caderno, Meta vinculada e Notas disponíveis; salvar cria ou reutiliza seu cartão de Revisão. Pistas Meta dependentes da imagem mostram um aviso porque atualizações do Street View podem torná-las desatualizadas.

Na Cobertura, arraste o mapa de calor por país e use a roda do mouse, o controle deslizante ou os botões para ajustar o zoom. Clique em um país para abrir seu mapa regional com a mesma camada. As regiões são identificadas pelos dados salvos do local ou pelo Google Maps ao abrir o mapa. Alguns países não têm mapa regional; locais sem região identificada ficam sem cor.

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

O mapa do resultado mantém a resposta verde centralizada e afasta o zoom até mostrar o palpite vermelho de hoje e todos os palpites anteriores com coordenadas em azul. O zoom escolhido é a escala mais próxima permitida. A nota e a próxima fila são salvas antes de o resultado aparecer; recarregar após uma aprovação segue para o próximo cartão.
