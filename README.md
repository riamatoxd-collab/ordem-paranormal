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


## Recursos integrados aos indicadores — versão 1.9

- Os controles de ajuste de PV, PE e SAN foram movidos para dentro dos próprios cartões de recursos no topo da ficha.
- Cada cartão agora reúne valor atual, campo de quantidade e botões de redução e recuperação.
- O painel separado de ajuste foi removido para deixar a ficha mais compacta.
- As regras de limites, consumo prioritário de PE temporários e registro no histórico foram mantidas.


## Resultado de perícias em tela — versão 2.0

- Ao clicar em uma perícia na ficha, o resultado aparece em uma janela sobreposta à tela, em vez de ocupar espaço dentro da ficha.
- A janela exibe o agente, a perícia, os dados rolados, o atributo, o treinamento, eventuais penalidades e o total.
- A janela pode ser fechada pelo botão ×, clicando fora do cartão ou pressionando Esc.
- As opções de Eclético e Perito continuam disponíveis dentro da janela de resultado.


## Testes diretos de atributo — versão 2.1

- Os cinco atributos da ficha (Agilidade, Força, Intelecto, Presença e Vigor) agora são clicáveis e abrem o resultado em tela.
- O teste direto usa somente a quantidade de dados do atributo: com atributo 0, rola 2d20 e mantém o menor; com atributo 1 ou maior, rola essa quantidade de d20 e mantém o maior.
- Perícias que exigem treinamento e estão destreinadas oferecem a opção de rolar diretamente o atributo associado, sem bônus de treinamento. Especialistas continuam podendo usar Eclético quando disponível.
- Os testes diretos são registrados no histórico como Atributo.


## Perícias em página própria e ataques automáticos — versão 2.3

- A lista completa de perícias saiu da ficha individual e ganhou uma aba própria chamada **Perícias**, posicionada logo abaixo de **Inventário** no menu lateral.
- A ficha do agente ficou mais compacta e mantém um atalho para abrir o painel de perícias.
- O painel de perícias possui controle **Ocultar perícias / Mostrar perícias**. A preferência é salva por agente e preservada ao editar a ficha.
- Cada item marcado como arma no inventário recebe uma ação de ataque. Todos os 28 modelos de arma já existentes nos presets do site possuem perfil automático; itens personalizados sem perfil são encaminhados ao Terminal de Combate para configuração manual.
- O ataque automático escolhe Luta ou Pontaria, rola os dados conforme o atributo, aplica o treinamento, a proficiência da classe, penalidades de alcance e de empunhadura, verifica acerto e crítico e rola o dano.
- Dano corpo a corpo e de arremesso soma Força quando a regra da arma determina. Acertos críticos multiplicam os dados de dano, não o bônus fixo de Força.
- O inventário permite informar a Defesa do alvo (padrão 15) e o alcance (curto, médio, longo ou extremo).
- A Espingarda de Cano Duplo tem dois comandos: disparo normal e disparo dos dois canos (6d6, com penalidade de −1d20 no ataque).
- A Pistola Pesada aplica −1d20 quando usada com uma mão; empunhada com as duas mãos, essa penalidade é removida. Armas de duas mãos não podem atacar quando marcadas como empunhadas com apenas uma mão; a katana aceita uma mão para personagens veteranos em Luta.
- Os ataques automáticos são registrados no histórico como Combate.


## Rituais, poderes e Transcender — versão 2.5

- Nova página **Rituais & Poderes**, acessível pelo menu lateral e vinculada ao agente ativo.
- Exibe poderes de classe, poderes paranormais e rituais conhecidos, com o uso de rituais pela própria página.
- O ritual **Transcender** abre uma experiência em tela central com expansão do símbolo, escolha de poder e som ambiente procedural de baixa frequência. O som começa após o clique do jogador e pode ser desligado.
- Em cada marco de poder de classe disponível, o jogador escolhe entre um poder normal da classe ou **Transcender**. A escolha normal não reduz Sanidade; Transcender registra o poder de classe Transcender, concede um poder paranormal e reduz o máximo de SAN pelo ganho daquele aumento de NEX.
- A seleção respeita os pré-requisitos dos poderes de classe e paranormais. Poderes paranormais elementais podem ser escolhidos uma segunda vez para o benefício de Afinidade após a escolha elemental em NEX 50% e a primeira Transcendência posterior.
- A origem **Cultista Arrependido** tem seu poder paranormal separado do avanço Transcender e não aplica a perda de SAN do ritual.
- A progressão de círculos e rituais conhecidos respeita classe, NEX, trilha e o poder **Aprender Ritual**. O arquivo de rituais permite filtrar por nome, elemento e círculo.
- Os rituais conhecidos usam os controles de conjuração já existentes, com custos de PE, aprimoramentos e histórico.
- A página apresenta a orientação de estudo de rituais de *Sobrevivendo ao Horror*. As regras opcionais de aprendizado lento não são ativadas automaticamente.

## Poderes adicionais na ficha de agente

Na seção **Poderes & Habilidades**, é possível adicionar poderes já cadastrados nos catálogos de classe, paranormal, origem e trilha; também é possível criar poderes personalizados com nome, descrição, custo opcional de PE e limite por turno ou cena.

- Poderes adicionados manualmente são **concessões da mesa** e não substituem as escolhas oficiais de progressão por NEX. A aplicação de pré-requisitos e efeitos passivos deve ser acordada com o mestre.
- Poderes personalizados ativáveis consomem PE conforme o custo informado, respeitam os limites do sistema e registram a ativação no histórico do mestre.
- Poderes do catálogo com ações de PE implementadas no sistema podem ser utilizados na seção de habilidades de PE. Seus custos são definidos pelo sistema; custos manuais servem para poderes sem ação automática.
- Poderes adicionais podem ser removidos, e os personalizados também podem ser editados.
- Os poderes são armazenados na ficha no navegador atual e preservados quando o agente é editado; ainda não há sincronização entre dispositivos.

## Grimório — descrições e referências dos rituais

O catálogo inclui **85 opções de ritual do Livro Básico v1.3**, correspondentes a 82 nomes (Amaldiçoar Arma possui quatro variações elementais), além de **16 rituais adicionais de Sobrevivendo ao Horror v1.3.1**: 101 opções no total.

- Cada ritual mostra elemento, círculo, custo básico de PE, descrição resumida e o livro/página para consulta.
- A busca do Grimório aceita tanto o nome quanto palavras dos resumos; os filtros por elemento e círculo permanecem.
- Os rituais conhecidos na ficha têm uma seção expansível **Descrição e referência**; os botões de conjuração foram preservados.
- Os textos de `rituais-descricoes.js` são resumos escritos para este aplicativo, não transcrições dos livros. Os aprimoramentos Discente/Verdadeiro, testes, condições, componentes e exceções continuam sujeitos às regras originais.
- Os 16 rituais do suplemento entram no catálogo geral e podem ser aprendidos quando atenderem aos filtros de círculo/NEX já implementados na aplicação.

**Fontes:** *Ordem Paranormal RPG v1.3*, seção Descrição dos Rituais, pp. 124–143; *Sobrevivendo ao Horror v1.3.1*, seção Novos Rituais, pp. 48–56.

## Editor rápido de atributos na ficha

Um **botão circular com ícone de edição e sinal +** aparece no canto direito do cabeçalho **ATRIBUTOS**, na ficha de agente. Ao clicar, abre um editor para **AGI, FOR, INT, PRE e VIG** com botões `−` e `+`, `Salvar alterações` e `Cancelar`.

- O editor permite valores de **0 a 10** como ajuste manual da mesa. Valores acima dos limites normais não fazem parte das regras padrão de criação: são uma opção para campanhas personalizadas.
- A alteração só é aplicada ao selecionar **Salvar alterações**; ao cancelar, os valores originais permanecem.
- Os pontos manuais ficam armazenados em `manualAttributeBonuses`, separados dos aumentos de atributo por NEX. Dessa forma, os ajustes não desaparecem quando a ficha é editada ou o NEX muda.
- Ao salvar, os novos atributos passam a valer para rolagens e cálculos de PV/PE/Defesa. A quantidade atual de PV/PE não aumenta automaticamente; ela é limitada ao novo máximo se necessário.
- As alterações são registradas no histórico local.

## Painel do Mestre — bloqueio e Som do Vazio

A entrada no **Painel do Mestre** solicita um PIN configurado pelo mestre. A senha é verificada no navegador; o painel não abre pela navegação normal antes de informar o PIN correto. O botão **Bloquear painel** fecha o acesso, e ao sair do painel o acesso é bloqueado novamente.

**Importante:** por ser um site estático, esta é apenas uma proteção de interface, **não uma autenticação segura**. O PIN está no JavaScript e pode ser visto por quem inspecionar os arquivos; os registros locais permanecem acessíveis pelo navegador. Para dados confidenciais ou acesso de jogadores em dispositivos distintos, seria necessário um servidor com autenticação real.

O **Som do Vazio** é criado por Web Audio API (tons graves e ruído filtrado), começa após o acesso autorizado e pode ser ligado ou desligado no topo do painel. O áudio para ao sair ou bloquear. A inicialização exige interação do usuário e pode ser impedida pelas configurações do navegador; não são usados arquivos de música externos.

## Reiniciar e recuperar PE

Na ficha do agente e na área **Controle de Esforço** do Painel do Mestre estão disponíveis três controles distintos:

- **Novo turno:** zera o gasto de PE contabilizado no turno e libera novamente habilidades de uso por turno. Não recupera PE normais.
- **Encerrar cena:** reinicia limites/usos por turno e cena e remove PE temporários. Não recupera PE normais.
- **Recuperar PE:** restaura os PE normais ao máximo calculado pela ficha. **Não** reinicia por si só o limite de gasto do turno nem remove PE temporários.

As alterações são persistidas no navegador e registradas no histórico; encerrar cena e recuperar PE pedem confirmação.
