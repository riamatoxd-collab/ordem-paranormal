# O Outro Lado — Rolador de Ordem Paranormal

Ferramenta independente de apoio à mesa, com fichas automáticas, escolhas de poderes, progressão por NEX, rituais, rolagens, combate, histórico e inventário integrado.

## Abrir o jogo

Abra o arquivo [index.html](./index.html) no navegador ou publique o repositório com GitHub Pages para acessá-lo por um endereço web.

## Ficha automática — versão 1.5

- Criação de agente com origem, classe, trilha, patente, NEX, atributos, perícias e descrição narrativa.
- Atributos iniciais validados conforme a distribuição de pontos do livro básico.
- PV, PE, Sanidade e limite de PE calculados pela classe, NEX e benefícios de origem/poderes selecionados.
- Seleção dos poderes de classe liberados em cada marco de NEX, com pré-requisitos verificados.
- Escolha da trilha e exibição automática das habilidades liberadas por NEX.
- Escolha de Versatilidade em NEX 50%: poder adicional da classe ou primeiro poder de outra trilha da mesma classe.
- Poderes paranormais disponíveis por Transcender e pela origem Cultista Arrependido, com pré-requisitos elementais.
- Lista de rituais conhecidos com círculo permitido pelo NEX, incluindo escolhas extras de Aprender Ritual e trilhas de Ocultista.
- Ficha detalhada com atributos, Defesa calculada, Iniciativa, DT de rituais, perícias, poderes, habilidades de trilha e rituais.
- Benefícios automáticos de algumas origens e poderes que alteram PV, PE, Sanidade, limite de PE ou Defesa.

## Inventário integrado

- Capacidade de carga calculada pela Força, com ajustes de poderes e equipamentos.
- Espaços ocupados por item, quantidade e estado (guardado, empunhado ou vestido).
- Sobrecarga, limite máximo, penalidades e controle de mãos ocupadas.
- Limites de requisição por patente e categoria.
- Suporte a Mochila Militar, Inventário Organizado, Mochila de Utilidades e Trilha Técnico.
- Regra opcional de até quatro itens vestidos com benefícios mecânicos.

## Armazenamento

As fichas, inventários e histórico são salvos no armazenamento local do navegador (`localStorage`). Eles ficam neste navegador e dispositivo; não são sincronizados automaticamente entre aparelhos. Exporte ou faça cópias de segurança dos dados antes de limpar os dados do navegador.

## Referência de regras

As opções de criação, classes, origens, poderes, trilhas e rituais foram estruturadas com base no livro básico *Ordem Paranormal RPG v1.3* fornecido nesta conversa. O inventário também considera as regras de *Sobrevivendo ao Horror v1.3.1*. A ferramenta apresenta resumos curtos para facilitar a escolha; consulte os livros para o texto completo e para resolver exceções.

Projeto independente, não oficial e sem vínculo com Ordem Paranormal, Cellbit ou Ordo Realitas.

## Painel de perícias — versão 1.6

- Todas as 28 perícias aparecem diretamente na página individual do agente.
- Cada perícia é um botão clicável: ao selecionar, a ficha rola automaticamente os d20 correspondentes ao atributo.
- O resultado considera o maior dado quando o atributo é maior que zero; com atributo 0, rola 2d20 e mantém o menor.
- Aplica automaticamente o bônus de treinamento (+5, +10 ou +15) e a penalidade de sobrecarga nas perícias indicadas.
- Perícias que exigem treinamento exibem o bloqueio quando o agente ainda não as treinou.
- Mostra os dados, atributo, treinamento, modificadores e total no próprio painel, sem navegar para outra tela.
- Registra cada rolagem no histórico geral e atualiza os contadores do painel inicial.


## Gestão de Pontos de Esforço — versão 1.7

- A ficha individual agora mostra PE atuais, PE temporários, limite de gasto por turno e quanto já foi gasto no turno.
- Os botões de habilidades com custo de PE consomem os pontos automaticamente e registram o uso no histórico.
- O sistema aplica o limite de PE por turno conforme NEX, incluindo os ajustes de Universitário, Encarar a Morte e Presença Poderosa (Intuitivo, apenas para rituais).
- A exceção do custo mínimo é respeitada: uma habilidade pode ser usada pelo custo mínimo acima do limite normal quando for a primeira habilidade que gasta PE naquele turno.
- PE temporários são consumidos antes dos PE normais e podem ser registrados manualmente; desaparecem ao encerrar a cena.
- Novo turno reinicia o contador de gasto e os usos por rodada; encerrar cena limpa PE temporários e usos por cena.
- Eclético consome 2 PE ao ativar o teste com treinamento temporário; Perito consome PE e rola o dado adicional correspondente ao custo escolhido.
- Ações de classe, poderes paranormais, origens e trilhas com custo em PE são exibidas quando o personagem possui a habilidade.
- Rituais usam o custo básico do círculo (1º: 1 PE; 2º: 3 PE; 3º: 6 PE; 4º: 10 PE), com campo para acréscimos de formas avançadas e opções de habilidades que alteram a conjuração.
- Criar Selo consome PE igual ao custo do ritual e não entra no contador de gasto do turno, pois é uma ação de interlúdio.
- O Flagelador pode marcar o pagamento do custo de um ritual com PV, à taxa de 2 PV por PE.
- Reduções de custo de rituais respeitam o mínimo de 1 PE e a regra geral de não cumulatividade, com a exceção de Ritual Predileto prevista no poder.


## Ajuste rápido de recursos — versão 1.8

- A ficha do agente inclui controles individuais para PV, PE e SAN.
- Informe a quantidade e use os botões + e − para recuperar ou reduzir o recurso.
- PV e SAN respeitam os valores máximos calculados para o personagem e não podem ficar abaixo de zero.
- A recuperação de PE restaura PE normais até o máximo da ficha; PE temporários continuam separados.
- Ao gastar PE manualmente, o sistema consome PE temporários primeiro, depois PE normais, e contabiliza o gasto no limite do turno.
- Os ajustes manuais são registrados no histórico de recursos.
