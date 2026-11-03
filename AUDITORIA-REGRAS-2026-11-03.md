# Auditoria de Regras — Ordem Paranormal v1.3 + Sobrevivendo ao Horror v1.3.1

Data da rodada: 03/11/2026. Comparação feita entre os **dois PDFs fornecidos para o projeto** e os arquivos principais do site (`index.html`, `ficha-mestre.js`, `samurai-fichas.js`, `rituais-regras-completas.js` e arquivos do Grimório).

**Status:** revisão parcial e orientada a risco. **Não** é certificação de 100% de conformidade com todos os capítulos, combinações e erratas. Regra narrada, não implementada, é diferente de regra calculada erroneamente. Este relatório não reproduz páginas extensas dos livros.

## Regras principais verificadas

| Área | Livro e páginas impressas | Status | Observações |
|---|---|---|---|
| Criação de agente da Ordem | Básico, criação de personagem e classes, p. 18–35 | Conferido | Quatro pontos distribuídos acima do valor inicial 1 (soma 9), respeitando teto inicial 3. |
| PV/PE/SAN de Combatente, Especialista e Ocultista | Básico, p. 25, 29 e 33 | Conferido | Fórmulas iniciais e acréscimos a cada 5% de NEX correspondem às classes. |
| Limite de PE por turno | Básico, p. 23 e regras de habilidades, p. 78 | Base conferida | Limite em função do NEX, incluindo exceção de custo mínimo; poder de origem e trilha exigem tratamento específico. |
| Perícias / atributo-base / somente treinadas / carga | Básico, tabela 2.1, p. 41 | Conferido | Catálogo do site acompanha as colunas da tabela. |
| Grau de Treinamento | Básico, Combatente p. 26, Especialista p. 30, Ocultista p. 34 | **Corrigido** | Veteranização desbloqueada em NEX 35%; Expert em NEX 70%; orçamento de aumentos por classe e Intelecto conferido ao salvar. |
| Perícias iniciais de agente | Básico, p. 18–35 | **Corrigido parcialmente** | Em nova ficha de NEX 5%, o site não aceita treinamento superior ao concedido por origem e classe. Fichas criadas diretamente em NEX alto podem requerer conferência individual de poderes que concedam perícias extras. |
| Universitário / Dedicação | Básico, p. 21 | **Corrigido** | PE máximo inclui **+1 PE inicial**, mais um a cada NEX ímpar de 15% até 95%; limite de PE por turno +1. |
| Cultista Arrependido / Traços do Outro Lado | Básico, p. 18 | **Corrigido** | Apenas a SAN **inicial** é reduzida pela metade. A progressão posterior por classe não é dividida por dois. |
| SAN ao Transcender | Básico, poderes paranormais, p. 114 | Conferido na fórmula | Deduções por avanço em que foi escolhido Transcender. Escolhas de afinidade devem ser verificadas no fluxo completo. |
| Sobrevivente: criação e recursos | Sobrevivendo ao Horror, p. 30 | **Corrigido parcialmente** | NEX 0%, três pontos de atributo (soma 8), 1+INT perícias adicionais às de origem, aumento de atributo no estágio 3; PV/PE/SAN por estágio já calculados. |
| Catálogo do Grimório | Básico, p. 124–143, suplemento p. 48–56 | Cobertura estrutural | 101 entradas de catálogo, 98 fichas de ritual (uma para as 4 variantes elementais de Amaldiçoar Arma). Alguns efeitos de múltiplas modalidades exigem consulta do livro. |
| Conjuração aprimorada | Básico, seção de rituais, p. 124–143 | **Validação corrigida** | Formas Discente/Verdadeira passam a ser a fonte do gasto adicional; custo digitado manualmente não pode mais ignorar requisitos de círculo e afinidade. |
| Cinco Samurais | Campanha do mestre, fichas próprias | **Regra caseira** | PD, habilidades únicas, cores, armas especiais e progressão das cinco fichas não pertencem às regras gerais das classes do Livro Básico. Permanecem intocados. |

## Pendências confirmadas / limites do site

1. **Alta — Sobrevivente: trilhas e habilidades de estágio.** O suplemento concede `Empenho` no estágio 1, habilidades de trilha nos estágios 2 e 4 e `Cicatrizado` no estágio 5 (p. 30–33). O site possui o campo de estágio e a fórmula de recursos, mas o objeto de `TRAILS` inclui apenas Combatente, Especialista e Ocultista. Falta cadastrar e aplicar as opções específicas de Sobrevivente e os demais poderes do suplemento.
2. **Alta — Graduado: Grimório Ritualístico.** O Básico p. 35 descreve rituais armazenados separadamente, com grimório ocupando espaço e uma ação completa de folhear antes de conjurar. O site hoje soma seus espaços ao conjunto de rituais comuns e permite conjuração no mesmo fluxo. É necessário separar rituais memorizados de rituais armazenados.
3. **Média — Críticos na Central de Combate.** O livro p. 82 diferencia margem e multiplicador de crítico. A Central de Combate atual rola ataque e dano informado sem calcular essa regra; a própria interface informa que críticos ficam a cargo do mestre. Isso é **funcionalidade manual**, não um cálculo equivalente ao livro. As fichas especiais de samurai têm outra rotina caseira de crítico.
4. **Média — Reações defensivas, dano massivo e estados.** O Livro Básico p. 88 traz Bloqueio, Esquiva e Dano Massivo. A implementação geral ainda não cobre automaticamente todos esses testes, custos e consequências; permanecem sob adjudicação do mestre.
5. **Média — Regras opcionais e conteúdo complementar.** O suplemento contém novas trilhas, poderes gerais, ameaças e regras opcionais; o site não implementa todas essas opções. É necessário definir quais serão usadas na campanha antes de fazer uma migração mecânica.
6. **Média — Aprimoramentos e exceções de ritual.** O catálogo oferece metadados e resumos autorais, não todas as regras específicas de área, modalidade, contra-efeitos, alvos e condições da obra. Um rito pode exigir escolhas adicionais do mestre. Uma segunda rodada deve conferir individualmente as 98 fichas contra as páginas originais, registrando cada campo confirmado.

## Testes executados nesta rodada

- A sintaxe do JavaScript inline do `index.html` passou em `new Function`.
- Testes com a função `stats(c)` extraída do código atual passaram para Combatente NEX 5% e 35%, Universitário 5% e 15%, Cultista Arrependido 5% e 35%, Sobrevivente estágios 1 e 3.
- Testes com a rotina real `saveAgent(e)` extraída do código passaram para: Sobrevivente estágio 1 válido; rejeição de quatro pontos distribuídos para Sobrevivente; rejeição de perícias iniciais em excesso em Combatente de NEX 5%; rejeição de Expert em NEX 5%.
- A validação dos aprimoramentos foi inspecionada estaticamente; **ainda falta um teste de conjuração ponta a ponta em navegador**.
- Nenhum personagem persistido no Supabase foi editado ou migrado. Os novos máximos serão calculados na apresentação da ficha; recursos atuais salvos não são automaticamente restaurados.

## Próxima etapa sugerida

Implementar primeiro **trilhas de Sobrevivente** e a separação do **Grimório Ritualístico** do Graduado. Depois adicionar calculadora de **crítico e defesas**, testar os combos das três classes e comparar ritual por ritual com um relatório dos campos divergentes. Registrar testes automáticos para impedir regressões.
