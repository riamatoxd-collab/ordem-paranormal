/* TEMPUS CUSTODIA | Sala das Três Alavancas
 * Interface de jogo; nenhuma solução secreta aparece no JavaScript.
 * Tentativas e resolução são verificadas pela infraestrutura existente:
 * enigmas-mural.js -> mysteryRequest -> trigger privado do Supabase.
 */
(function () {
  'use strict';
  const TITLE = 'As Três Alavancas do Tempo';
  const LABELS = ['Passado', 'Presente', 'Futuro'];
  const SYMBOLS = {'Passado':'◴', 'Presente':'◷', 'Futuro':'◶'};
  const list = document.getElementById('puzzleList');
  if (!list) return;

  const sequences = new Map();
  const triesPrevious = new Map();
  const messages = new Map();
  let previewSequence = [];
  let previewMessage = '';
  let activeAccount = '';

  const idForAccount = () => window.OPAccounts?.current?.id || '';
  const sameTitle = text => String(text || '').trim().toLocaleLowerCase('pt-BR') === TITLE.toLocaleLowerCase('pt-BR');
  const sequenceOf = (id, preview) => preview ? previewSequence : (sequences.get(id) || []);

  function resetIfAccountChanged() {
    const now = idForAccount();
    if (now === activeAccount) return;
    activeAccount = now;
    sequences.clear();
    triesPrevious.clear();
    messages.clear();
    previewSequence = [];
    previewMessage = '';
  }

  const safeNumber = value => Number.isInteger(value) && value >= 0 ? value : 0;
  const slot = (name, i) =>
    '<span class="tempo-slot' + (name ? ' is-filled' : '') + '" aria-label="Posição ' + (i + 1) + (name ? ': ' + name : ': vazia') + '">' +
    '<small>' + String(i + 1).padStart(2, '0') + '</small><strong>' + (name || '—') + '</strong></span>';

  function machineMarkup(id, options) {
    const {playable, solved, remaining, preview, isMaster} = options;
    const seq = solved ? [] : sequenceOf(id, preview);
    const ready = seq.length === 3;
    const status = solved ? 'MEMÓRIA RECUPERADA' : ready ? 'SEQUÊNCIA DEFINIDA' : 'MECANISMO ADORMECIDO';
    const controls = LABELS.map((name, index) => {
      const pulled = seq.includes(name);
      const disabled = !playable || solved || pulled || ready;
      return '<button type="button" class="tempo-lever' + (pulled ? ' is-pulled' : '') +
        '" data-tempo-pull="' + id + '" data-tempo-name="' + name + '" aria-label="Acionar alavanca ' + name +
        '" aria-pressed="' + String(pulled) + '"' + (disabled ? ' disabled' : '') + '>' +
        '<span class="tempo-lever-symbol" aria-hidden="true">' + SYMBOLS[name] + '</span>' +
        '<span class="tempo-lever-track" aria-hidden="true"><span class="tempo-lever-stick"></span><span class="tempo-lever-knob"></span></span>' +
        '<span class="tempo-lever-name">' + name + '</span>' +
        '<small>' + (pulled ? 'ACIONADA' : 'PUXAR') + '</small></button>';
    }).join('');

    const count = '<div class="tempo-console-counter" aria-label="' + seq.length + ' de 3 alavancas selecionadas">' +
      '<span>SEQUÊNCIA</span><strong>' + String(seq.length).padStart(2, '0') + '<em>/03</em></strong></div>';

    const display = '<div class="tempo-console-floor">' +
      '<div class="tempo-floor-head"><span>◈ ORDEM REGISTRADA</span><small>O mecanismo aguarda a combinação</small></div>' +
      '<div class="tempo-sequence" aria-live="polite">' + [0,1,2].map(i => slot(seq[i], i)).join('') + '</div>' +
      '</div>';

    const form = playable && !preview
      ? '<form class="mystery-answer-form tempo-mechanism-form" data-puzzle-form="' + id + '">' +
          '<input type="hidden" name="guess" value="' + seq.join(' > ') + '">' +
          '<button type="submit" class="btn primary tempo-confirm" ' + (ready ? '' : 'disabled') +
           '>✦ Ativar mecanismo</button>' +
          '<button type="button" class="btn tempo-clear" data-tempo-reset="' + id + '" ' +
            (seq.length ? '' : 'disabled') + '>↺ Reiniciar</button>' +
          '<small>' + remaining + ' tentativa(s) restante(s). Apenas confirmar consome uma tentativa.</small>' +
        '</form>'
      : preview
      ? '<div class="tempo-mechanism-form tempo-demo-actions">' +
          '<button type="button" class="btn primary tempo-demo" data-tempo-demo="1" ' + (ready ? '' : 'disabled') + '>✦ Simular ativação</button>' +
          '<button type="button" class="btn tempo-clear" data-tempo-reset="0" ' + (seq.length ? '' : 'disabled') + '>↺ Reiniciar</button>' +
          '<small>Prévia do mestre: nenhuma tentativa será enviada ao servidor.</small>' +
        '</div>'
      : '';

    const story = solved
      ? '<div class="tempo-mechanism-success" role="status"><strong>✦ O tempo volta a correr para trás.</strong>' +
        '<p>Engrenagens giram na direção contrária, enquanto décadas de ferrugem desaparecem. No santuário, as peças da armadura de <b>Masamune Hayato</b> se reconstroem.</p></div>'
      : (!playable && !preview
        ? '<p class="tempo-mechanism-note">' +
          (isMaster ? 'Visualização do mestre: somente jogadores podem enviar respostas.' :
           remaining === 0 ? 'As tentativas desta conta terminaram. Peça uma dica ao mestre.' :
           'Este mecanismo está indisponível para interação.') + '</p>'
        : '');

    const feedback = preview ? previewMessage : (messages.get(id) || '');
    const wheels = '<div class="tempo-gear-cluster" aria-hidden="true"><span>⚙</span><span>⚙</span></div>';
    return '<section class="tempo-mechanism' + (solved ? ' is-solved' : '') +
      '" data-tempo-machine="' + id + '"' +
      ' style="--tempo-progress:' + safeNumber(seq.length) + '" aria-label="Mecanismo das três alavancas">' +
      '<div class="tempo-mechanism-head"><div class="tempo-title-stack">' +
      '<small>MINA ESQUECIDA • CÂMARA DE ENGRENAGENS</small><strong>O MECANISMO DAS TRÊS ERAS</strong>' +
      '</div>' + count + '</div>' +
      '<div class="tempo-console">' +
      '<div class="tempo-console-status"><span class="tempo-indicator" aria-hidden="true"></span>' +
      '<span>' + status + '</span>' + wheels + '</div>' +
      '<p class="tempo-mechanism-intro">O ferro antigo responde à sua mão. Use a carta encontrada no dormitório para decidir qual era deve despertar primeiro.</p>' +
      '<div class="tempo-levers" role="group" aria-label="Três alavancas temporais">' + controls + '</div>' +
      display + '</div>' + form + story +
      '<p class="tempo-mechanism-feedback" role="status" aria-live="polite">' + feedback + '</p>' +
      '</section>';
  }

  function makeCardInteractive(card) {
    const title = card.querySelector('h3')?.textContent;
    if (!sameTitle(title) || card.dataset.tempoReady === '1') return;
    const id = Number(String(card.id || '').replace('puzzleCard', ''));
    if (!Number.isInteger(id) || id <= 0) return;

    const form = card.querySelector('form[data-puzzle-form]');
    const done = !!card.querySelector('.mystery-solved');
    const masterView = !!card.querySelector('.mystery-card-actions');
    let remaining = 0;

    if (form) {
      const m = String(form.querySelector('small')?.textContent || '').match(/(\d+)\s+tentativa/i);
      remaining = m ? Number(m[1]) : 0;
      const previous = triesPrevious.get(id);
      if (previous !== undefined && remaining < previous) {
        sequences.delete(id);
        messages.set(id, 'As engrenagens retornaram à posição inicial. Releia a carta e tente outra combinação.');
      }
      triesPrevious.set(id, remaining);
    }

    card.dataset.tempoReady = '1';
    card.dataset.tempoPlayable = String(!!form && !done);
    card.dataset.tempoRemaining = String(remaining);
    card.classList.add('tempo-puzzle-card');

    if (done) {
      sequences.delete(id);
      messages.delete(id);
    }

    const html = machineMarkup(id, {playable: !!form && !done, solved: done, remaining, preview:false, isMaster:masterView});
    if (form) form.outerHTML = html;
    else card.insertAdjacentHTML('beforeend', html);
  }

  function mountCards() {
    resetIfAccountChanged();
    list.querySelectorAll('.mystery-puzzle-card').forEach(makeCardInteractive);
  }

  function redraw(card, id, preview = false) {
    const el = preview
      ? document.querySelector('#puzzleBuilderPreview .tempo-preview .tempo-mechanism')
      : card?.querySelector('[data-tempo-machine="' + id + '"]');
    if (!el) return;
    const remaining = preview ? 8 : safeNumber(Number(card.dataset.tempoRemaining));
    const html = machineMarkup(id, {
      playable: preview || card.dataset.tempoPlayable === 'true',
      solved: !preview && !!card.querySelector('.mystery-solved'),
      remaining, preview, isMaster:false
    });
    el.outerHTML = html;
  }

  list.addEventListener('click', event => {
    const btn = event.target.closest('[data-tempo-pull],[data-tempo-reset]');
    if (!btn || !list.contains(btn)) return;
    const id = Number(btn.dataset.tempoPull ?? btn.dataset.tempoReset);
    const card = btn.closest('.tempo-puzzle-card');
    if (!card || !Number.isInteger(id) || id <= 0 || card.dataset.tempoPlayable !== 'true') return;

    if (btn.hasAttribute('data-tempo-reset')) {
      sequences.delete(id);
      messages.delete(id);
    } else {
      const name = btn.dataset.tempoName;
      const seq = sequenceOf(id, false);
      if (!LABELS.includes(name) || seq.length >= 3 || seq.includes(name)) return;
      sequences.set(id, [...seq, name]);
      messages.delete(id);
    }
    const viaKeyboard = event.detail === 0;
    redraw(card, id);
    if (viaKeyboard) {
      const next = card.querySelector('.tempo-lever:not([disabled]),.tempo-confirm:not([disabled]),.tempo-clear:not([disabled])');
      next?.focus();
    }
  });

  const observer = new MutationObserver(mountCards);
  observer.observe(list, {childList:true, subtree:true});
  mountCards();

  /* Área de testes: o mestre pode simular a interface, sem postar tentativas. */
  const preview = document.getElementById('puzzleBuilderPreview');
  function mountPreview() {
    if (!preview) return;
    const card = preview.querySelector('.mystery-puzzle-card');
    const title = preview.querySelector('#puzzleDraftTitle');
    const old = preview.querySelector('.mystery-answer-form');
    if (!card || !title || !old) return;
    const selected = sameTitle(title.textContent);
    old.hidden = selected;
    let box = preview.querySelector('.tempo-preview');
    if (selected && !box) {
      box = document.createElement('div');
      box.className = 'tempo-preview';
      box.innerHTML = machineMarkup(0, {playable:true,solved:false,remaining:8,preview:true,isMaster:true});
      card.appendChild(box);
    } else if (!selected && box) {
      previewSequence = [];
      previewMessage = '';
      box.remove();
    }
  }
  if (preview) {
    const previewObserver = new MutationObserver(mountPreview);
    previewObserver.observe(preview, {childList:true, subtree:true});
    preview.addEventListener('click', event => {
      const btn = event.target.closest('[data-tempo-pull],[data-tempo-reset],[data-tempo-demo]');
      if (!btn || !preview.contains(btn)) return;
      if (btn.hasAttribute('data-tempo-reset')) {
        previewSequence = [];
        previewMessage = '';
      } else if (btn.hasAttribute('data-tempo-demo')) {
        if (previewSequence.length !== 3) return;
        previewMessage = 'Simulação concluída. A resposta real será verificada pelo servidor quando um jogador enviar.';
      } else {
        const name = btn.dataset.tempoName;
        if (!LABELS.includes(name) || previewSequence.includes(name) || previewSequence.length >= 3) return;
        previewSequence = [...previewSequence,name];
        previewMessage = '';
      }
      redraw(null, 0, true);
    });
    mountPreview();
  }

  /* Atalho para o mestre selecionar o modelo já existente na oficina. */
  const prepare = document.getElementById('tempoPreparePuzzle');
  prepare?.addEventListener('click', () => {
    const template = [...document.querySelectorAll('#puzzleTemplates [data-puzzle-template]')]
      .find(button => button.textContent.includes(TITLE));
    const status = document.getElementById('puzzleStatus');
    if (!template) {
      if (status) status.textContent = 'Entre como mestre para carregar o modelo das alavancas.';
      return;
    }
    template.click();
    document.getElementById('puzzleTitle')?.scrollIntoView({behavior:'smooth',block:'center'});
    document.getElementById('puzzleTitle')?.focus({preventScroll:true});
  });
})();