# Auditoria e execução de rituais — rodada de implementação

Fontes: **Ordem Paranormal RPG v1.3**, seção de rituais (páginas impressas 117–143), e **Sobrevivendo ao Horror v1.3.1**, rituais adicionais (páginas impressas 48–56). Ritos e poderes caseiros dos cinco samurais são separados do sistema geral.

## Cobertura real

- **98 rituais com nomes únicos**, correspondentes às **101 entradas elementais** do catálogo. Todos possuem categoria de efeito e um fluxo de conjuração/resolução; os quatro `Amaldiçoar Arma` compartilham a mesma ficha de regras, com elemento distinto.
- **18 rituais** têm pelo menos uma fórmula de dados/valor numérico preenchida e verificada diretamente nos quadros dos dois livros nesta rodada. Os demais rituais não receberam fórmulas inventadas: o jogador pode preencher a rolagem quando pertinente, ou registrar a modalidade e a decisão do mestre.
- Sistema de resolução: escolha de alvo local ou externo, modalidade, estado da resistência, teste de resistência de uma ficha do mesmo navegador, rolagem de dano/cura, aplicação de PV e PV temporários, marcadores de condições e bônus, duração de cena/rodadas/sustentada, dissipação e histórico.
- **Custo do Paranormal**: rituais de elementos diferentes de Medo realizam teste de Ocultismo contra DT 20 + custo efetivo de PE. Em falha, perde-se SAN proporcional; falha por cinco ou mais também diminui SAN máxima em 1. Essa perda máxima permanece no registro da ficha.
- **Sustentar ritual**: no início de cada turno há opção de gastar 1 PE como ação livre; se não sustentado, o ritual encerra no próximo avanço de turno. Apenas um ritual sustentado por conjurador pode estar ativo.
- **Efeitos duradouros**: registrados na ficha do alvo quando o alvo está na mesma conta. Efeitos dirigidos a personagens em outras contas, a criaturas/NPCs ou a áreas ficam documentados para aplicação pelo mestre, pois as permissões do Supabase impedem alterar remotamente a ficha de outro jogador.
- **Poderes associados**: o sistema anterior já trata custos de Camuflar Ocultismo, Conduíte, Ritual Predileto, Mestre em Elemento, Tatuagem Ritualística, Lâmina Paranormal, Flagelador e outros. Agora as conjurações interagem com bônus de atributo, perícia, Defesa, resistência, dano/condição e efeitos ativos. Poderes ativos com PE são registrados para acompanhamento; Ataque Especial usa o bônus no ataque e o consome, e curas roladas por poderes podem ser aplicadas ao alvo escolhido.
- **Dissipar Ritual**: usa teste de Ocultismo para remover o efeito escolhido, comparado à DT do conjurador quando ele está cadastrado; efeitos externos precisam de arbitragem.
- **Milagre Ionizante**: permite selecionar uma condição registrada para remoção; consequências adicionais do ritual dependem das regras e do mestre.
- **Grimório**: o cartão de um ritual conhecido abre a ficha do agente para escolher a forma, poderes e conjurar, evitando custos irreais.

## Limites ainda não automatizados

**IMPORTANTE:** ter um fluxo funcional para os 98 rituais **não significa que toda consequência do livro seja resolvida automaticamente**. Vários rituais dependem de decisões descritivas, espaço e distâncias reais no mapa, controle mental de NPCs, objetos presentes, interpretação de efeitos múltiplos e requisitos ambientais. O site fornece escolhas, rolagens e registros, mas não pode determinar essas condições sem o mestre.

Além disso, o site ainda não implementa totalmente:
- todas as variações mecânicas e mudanças de alvo/área específicas de Discente e Verdadeira;
- integração em tempo real para aplicar dano, cura ou estados em fichas de outra conta (somente leitura do mestre no banco);
- todas as resistências especiais com sucesso parcial e múltiplos alvos;
- atualizações automáticas a cada rodada de dano persistente em monstros/NPCs externos;
- rolagens de poderes sem PE e detalhes individuais de todos os poderes (passivos fora das fórmulas existentes devem ser conferidos);
- cálculo de armadura, resistências e imunidades de NPCs;
- regras de Grimório Ritualístico do Graduado ainda pendentes na auditoria anterior.

**Regra de segurança do sistema:** não substituir decisões desconhecidas por estatísticas inventadas. A interface disponibiliza fórmula livre, estado de resistência e campo de decisão do mestre. O histórico registra essa resolução separadamente da conjuração. A fonte original deve ser consultada quando necessário.

## Fichas e tipos de efeito

| Ritual | Grupo | Fonte | Resolução |
|---|---|---|---|
| Alterar Destino | Proteção | Livro Básico v1.3 p. 124 | Escolhas e efeitos registrados; resolução contextual |
| Alterar Memória | Controle narrativo | Livro Básico v1.3 p. 124 | Escolhas e efeitos registrados; resolução contextual |
| Amaldiçoar Arma | Bônus e aprimoramento | Livro Básico v1.3 p. 124 | Fórmula verificada, com execução de dados |
| Amaldiçoar Tecnologia | Bônus e aprimoramento | Livro Básico v1.3 p. 124 | Escolhas e efeitos registrados; resolução contextual |
| Âncora Temporal | Condição ou restrição | Livro Básico v1.3 p. 124 | Escolhas e efeitos registrados; resolução contextual |
| Apagar as Luzes | Área/ambiente | Sobrevivendo ao Horror v1.3.1 p. 50 | Escolhas e efeitos registrados; resolução contextual |
| Aprimorar Físico | Bônus e aprimoramento | Livro Básico v1.3 p. 125 | Escolhas e efeitos registrados; resolução contextual |
| Aprimorar Mente | Bônus e aprimoramento | Livro Básico v1.3 p. 125 | Escolhas e efeitos registrados; resolução contextual |
| Arma Atroz | Bônus e aprimoramento | Livro Básico v1.3 p. 125 | Escolhas e efeitos registrados; resolução contextual |
| Armadura de Sangue | Proteção | Livro Básico v1.3 p. 125 | Escolhas e efeitos registrados; resolução contextual |
| Aurora da Verdade | Área/ambiente | Sobrevivendo ao Horror v1.3.1 p. 53 | Escolhas e efeitos registrados; resolução contextual |
| Canalizar o Medo | Investigação e utilidade | Livro Básico v1.3 p. 125 | Escolhas e efeitos registrados; resolução contextual |
| Capturar o Coração | Controle narrativo | Livro Básico v1.3 p. 125 | Escolhas e efeitos registrados; resolução contextual |
| Chamas do Caos | Área/ambiente | Livro Básico v1.3 p. 126 | Fórmula verificada, com execução de dados |
| Cicatrização | Cura e condições | Livro Básico v1.3 p. 126 | Fórmula verificada, com execução de dados |
| Cinerária | Área/ambiente | Livro Básico v1.3 p. 126 | Escolhas e efeitos registrados; resolução contextual |
| Coincidência Forçada | Bônus e aprimoramento | Livro Básico v1.3 p. 126 | Escolhas e efeitos registrados; resolução contextual |
| Compreensão Paranormal | Investigação e utilidade | Livro Básico v1.3 p. 126 | Escolhas e efeitos registrados; resolução contextual |
| Conhecendo o Medo | Controle narrativo | Livro Básico v1.3 p. 127 | Escolhas e efeitos registrados; resolução contextual |
| Consumir Manancial | PV temporários | Livro Básico v1.3 p. 127 | Fórmula verificada, com execução de dados |
| Contato Paranormal | Bônus e aprimoramento | Livro Básico v1.3 p. 127 | Escolhas e efeitos registrados; resolução contextual |
| Contenção Fantasmagórica | Condição ou restrição | Livro Básico v1.3 p. 127 | Escolhas e efeitos registrados; resolução contextual |
| Controle Mental | Controle narrativo | Livro Básico v1.3 p. 128 | Escolhas e efeitos registrados; resolução contextual |
| Convocação Instantânea | Investigação e utilidade | Livro Básico v1.3 p. 128 | Escolhas e efeitos registrados; resolução contextual |
| Convocar o Algoz | Controle narrativo | Livro Básico v1.3 p. 128 | Escolhas e efeitos registrados; resolução contextual |
| Corpo Adaptado | Bônus e aprimoramento | Livro Básico v1.3 p. 128 | Escolhas e efeitos registrados; resolução contextual |
| Decadência | Dano direto/recorrente | Livro Básico v1.3 p. 129 | Fórmula verificada, com execução de dados |
| Definhar | Condição ou restrição | Livro Básico v1.3 p. 129 | Escolhas e efeitos registrados; resolução contextual |
| Deflagração de Energia | Dano direto/recorrente | Livro Básico v1.3 p. 129 | Escolhas e efeitos registrados; resolução contextual |
| Desacelerar Impacto | Proteção | Livro Básico v1.3 p. 129 | Escolhas e efeitos registrados; resolução contextual |
| Descarnar | Dano direto/recorrente | Livro Básico v1.3 p. 129 | Fórmula verificada, com execução de dados |
| Desfazer Sinapses | Dano direto/recorrente | Sobrevivendo ao Horror v1.3.1 p. 53 | Fórmula verificada, com execução de dados |
| Detecção de Ameaças | Investigação e utilidade | Livro Básico v1.3 p. 130 | Escolhas e efeitos registrados; resolução contextual |
| Dissipar Ritual | Dissipação | Livro Básico v1.3 p. 130 | Escolhas e efeitos registrados; resolução contextual |
| Dissonância Acústica | Área/ambiente | Livro Básico v1.3 p. 130 | Escolhas e efeitos registrados; resolução contextual |
| Distorção Temporal | Investigação e utilidade | Livro Básico v1.3 p. 130 | Escolhas e efeitos registrados; resolução contextual |
| Distorcer Aparência | Bônus e aprimoramento | Livro Básico v1.3 p. 130 | Escolhas e efeitos registrados; resolução contextual |
| Eco Espiral | Dano direto/recorrente | Livro Básico v1.3 p. 131 | Escolhas e efeitos registrados; resolução contextual |
| Eletrocussão | Dano direto/recorrente | Livro Básico v1.3 p. 131 | Fórmula verificada, com execução de dados |
| Embaralhar | Proteção | Livro Básico v1.3 p. 131 | Escolhas e efeitos registrados; resolução contextual |
| Enfeitiçar | Controle narrativo | Livro Básico v1.3 p. 131 | Escolhas e efeitos registrados; resolução contextual |
| Esconder dos Olhos | Bônus e aprimoramento | Livro Básico v1.3 p. 132 | Escolhas e efeitos registrados; resolução contextual |
| Esfolar | Dano direto/recorrente | Sobrevivendo ao Horror v1.3.1 p. 48 | Fórmula verificada, com execução de dados |
| Espirais da Perdição | Condição ou restrição | Livro Básico v1.3 p. 132 | Escolhas e efeitos registrados; resolução contextual |
| Fedor Pútrido | Bônus e aprimoramento | Sobrevivendo ao Horror v1.3.1 p. 52 | Escolhas e efeitos registrados; resolução contextual |
| Ferver Sangue | Dano direto/recorrente | Livro Básico v1.3 p. 132 | Fórmula verificada, com execução de dados |
| Fim Inevitável | Dano direto/recorrente | Livro Básico v1.3 p. 132 | Escolhas e efeitos registrados; resolução contextual |
| Flagelo de Sangue | Condição ou restrição | Livro Básico v1.3 p. 133 | Escolhas e efeitos registrados; resolução contextual |
| Forma Monstruosa | Bônus e aprimoramento | Livro Básico v1.3 p. 133 | Escolhas e efeitos registrados; resolução contextual |
| Fortalecimento Sensorial | Bônus e aprimoramento | Livro Básico v1.3 p. 133 | Escolhas e efeitos registrados; resolução contextual |
| Hemofagia | Dano direto/recorrente | Livro Básico v1.3 p. 133 | Fórmula verificada, com execução de dados |
| Inexistir | Dano direto/recorrente | Livro Básico v1.3 p. 134 | Fórmula verificada, com execução de dados |
| Invadir Mente | Dano direto/recorrente | Livro Básico v1.3 p. 134 | Fórmula verificada, com execução de dados |
| Invólucro de Carne | Invocação | Livro Básico v1.3 p. 134 | Escolhas e efeitos registrados; resolução contextual |
| Lâmina do Medo | Dano direto/recorrente | Livro Básico v1.3 p. 135 | Escolhas e efeitos registrados; resolução contextual |
| Língua Morta | Investigação e utilidade | Sobrevivendo ao Horror v1.3.1 p. 51 | Escolhas e efeitos registrados; resolução contextual |
| Localização | Investigação e utilidade | Livro Básico v1.3 p. 135 | Escolhas e efeitos registrados; resolução contextual |
| Luz | Investigação e utilidade | Livro Básico v1.3 p. 135 | Escolhas e efeitos registrados; resolução contextual |
| Martírio de Sangue | Bônus e aprimoramento | Sobrevivendo ao Horror v1.3.1 p. 50 | Escolhas e efeitos registrados; resolução contextual |
| Medo Tangível | Proteção | Livro Básico v1.3 p. 135 | Escolhas e efeitos registrados; resolução contextual |
| Mergulho Mental | Controle narrativo | Livro Básico v1.3 p. 136 | Escolhas e efeitos registrados; resolução contextual |
| Miasma Entrópico | Dano direto/recorrente | Livro Básico v1.3 p. 136 | Fórmula verificada, com execução de dados |
| Milagre Ionizante | Cura e condições | Sobrevivendo ao Horror v1.3.1 p. 56 | Escolhas e efeitos registrados; resolução contextual |
| Mutar | Área/ambiente | Sobrevivendo ao Horror v1.3.1 p. 56 | Escolhas e efeitos registrados; resolução contextual |
| Nuvem de Cinzas | Área/ambiente | Livro Básico v1.3 p. 136 | Escolhas e efeitos registrados; resolução contextual |
| Ódio Incontrolável | Bônus e aprimoramento | Livro Básico v1.3 p. 136 | Escolhas e efeitos registrados; resolução contextual |
| Odor da Caçada | Bônus e aprimoramento | Sobrevivendo ao Horror v1.3.1 p. 49 | Escolhas e efeitos registrados; resolução contextual |
| Ouvir os Sussurros | Investigação e utilidade | Livro Básico v1.3 p. 137 | Escolhas e efeitos registrados; resolução contextual |
| Overclock | Investigação e utilidade | Sobrevivendo ao Horror v1.3.1 p. 55 | Escolhas e efeitos registrados; resolução contextual |
| Paradoxo | Dano direto/recorrente | Livro Básico v1.3 p. 137 | Fórmula verificada, com execução de dados |
| Perturbação | Controle narrativo | Livro Básico v1.3 p. 137 | Escolhas e efeitos registrados; resolução contextual |
| Poeira da Podridão | Dano direto/recorrente | Livro Básico v1.3 p. 138 | Fórmula verificada, com execução de dados |
| Polarização Caótica | Investigação e utilidade | Livro Básico v1.3 p. 138 | Escolhas e efeitos registrados; resolução contextual |
| Possessão | Controle narrativo | Livro Básico v1.3 p. 138 | Escolhas e efeitos registrados; resolução contextual |
| Presença do Medo | Dano direto/recorrente | Livro Básico v1.3 p. 139 | Escolhas e efeitos registrados; resolução contextual |
| Pronunciar Sigilo | Condição ou restrição | Sobrevivendo ao Horror v1.3.1 p. 54 | Escolhas e efeitos registrados; resolução contextual |
| Proteção contra Rituais | Proteção | Livro Básico v1.3 p. 139 | Escolhas e efeitos registrados; resolução contextual |
| Purgatório | Área/ambiente | Livro Básico v1.3 p. 139 | Escolhas e efeitos registrados; resolução contextual |
| Rejeitar Névoa | Área/ambiente | Livro Básico v1.3 p. 139 | Escolhas e efeitos registrados; resolução contextual |
| Relembrar Fragmento | Investigação e utilidade | Sobrevivendo ao Horror v1.3.1 p. 54 | Escolhas e efeitos registrados; resolução contextual |
| Salto Fantasma | Deslocamento | Livro Básico v1.3 p. 139 | Escolhas e efeitos registrados; resolução contextual |
| Sede de Adrenalina | Proteção | Sobrevivendo ao Horror v1.3.1 p. 49 | Escolhas e efeitos registrados; resolução contextual |
| Singularidade Temporal | Investigação e utilidade | Sobrevivendo ao Horror v1.3.1 p. 52 | Escolhas e efeitos registrados; resolução contextual |
| Sopro do Caos | Área/ambiente | Livro Básico v1.3 p. 140 | Escolhas e efeitos registrados; resolução contextual |
| Tecer Ilusão | Investigação e utilidade | Livro Básico v1.3 p. 140 | Escolhas e efeitos registrados; resolução contextual |
| Tela de Ruído | Proteção | Livro Básico v1.3 p. 141 | Fórmula verificada, com execução de dados |
| Teletransporte | Deslocamento | Livro Básico v1.3 p. 141 | Escolhas e efeitos registrados; resolução contextual |
| Tentáculos de Lodo | Condição ou restrição | Livro Básico v1.3 p. 141 | Escolhas e efeitos registrados; resolução contextual |
| Terceiro Olho | Investigação e utilidade | Livro Básico v1.3 p. 141 | Escolhas e efeitos registrados; resolução contextual |
| Transfigurar Água | Área/ambiente | Livro Básico v1.3 p. 142 | Fórmula verificada, com execução de dados |
| Transfigurar Terra | Área/ambiente | Livro Básico v1.3 p. 142 | Escolhas e efeitos registrados; resolução contextual |
| Transfusão Vital | Cura e condições | Livro Básico v1.3 p. 142 | Escolhas e efeitos registrados; resolução contextual |
| Tremeluzir | Bônus e aprimoramento | Sobrevivendo ao Horror v1.3.1 p. 55 | Escolhas e efeitos registrados; resolução contextual |
| Velocidade Mortal | Bônus e aprimoramento | Livro Básico v1.3 p. 142 | Escolhas e efeitos registrados; resolução contextual |
| Vidência | Investigação e utilidade | Livro Básico v1.3 p. 143 | Escolhas e efeitos registrados; resolução contextual |
| Vínculo de Sangue | Controle narrativo | Livro Básico v1.3 p. 143 | Escolhas e efeitos registrados; resolução contextual |
| Vomitar Pestes | Dano direto/recorrente | Livro Básico v1.3 p. 143 | Escolhas e efeitos registrados; resolução contextual |
| Zerar Entropia | Condição ou restrição | Livro Básico v1.3 p. 143 | Escolhas e efeitos registrados; resolução contextual |

## Verificação técnica

Validar todos os 98 nomes contra `GRIMOIRE_RITUAL_RULES`, a ordem de carregamento dos scripts, sintaxe JavaScript, custo de SAN, composição de bônus ativos e persistência de campos em `formChar()`. Os testes automatizados de funções puras não equivalem a uma sessão de navegador em múltiplos dispositivos.
