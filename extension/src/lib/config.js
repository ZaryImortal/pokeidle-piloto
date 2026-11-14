// Configuração do radar: padrões, limites e o que entra no escopo. Funções puras.
(function (raiz, fabrica) {
  const m = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else raiz.RadarConfig = m;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHAVE = 'radar:config';
  const TAXA_VENDA = 0.15; // comissão do vendedor em ouro (Termos, seção 11)

  // Peças numeradas: cada uma é única, então "preço normal" não existe.
  const CATEGORIAS_PROIBIDAS = Object.freeze(['box']);

  const NIVEIS_RARIDADE = Object.freeze(['comum', 'incomum', 'rara', 'mitica', 'lendaria']);

  function extrairRaridadeItem(item) {
    if (!item) return null;
    const id = Number(item.id);
    if (id === 70040 || id === 70080) return 'comum';
    if (id === 70041 || id === 70081) return 'incomum';
    if (id === 70042 || id === 70082) return 'rara';
    if (id === 70043 || id === 70083) return 'mitica';
    if (id === 70044 || id === 70084) return 'lendaria';
    const nome = String(item.nome || '').toLowerCase();
    if (/legendary|lend[aá]ri/i.test(nome)) return 'lendaria';
    if (/mythic|m[ií]tic/i.test(nome)) return 'mitica';
    if (/uncommon|incomum/i.test(nome)) return 'incomum';
    if (/rare|rara/i.test(nome)) return 'rara';
    if (/common|comum/i.test(nome)) return 'comum';
    return null;
  }

  function raridadePermitida(item, raridadeMax) {
    const rarItem = extrairRaridadeItem(item);
    if (!rarItem) return true;
    const max = (raridadeMax || 'comum').toLowerCase();
    const idxItem = NIVEIS_RARIDADE.indexOf(rarItem);
    const idxMax = NIVEIS_RARIDADE.indexOf(max);
    if (idxItem === -1 || idxMax === -1) return true;
    return idxItem <= idxMax;
  }

  const GRUPOS_VENDA = Object.freeze([
    // Itens Completos
    { chave: 'vendaPokemon', secao: 'itens', nome: 'Pokémon', rotulo: 'Vender Pokémons', padrao: 'off', ehMatch: (item) => item.categoria === 'pokemon' || item.tipo === 'pokemon' },
    { chave: 'vendaStones', secao: 'itens', nome: 'Stones', rotulo: 'Vender Stones', padrao: 'off', ehMatch: (item) => item.categoria === 'stone' || / stone$/i.test(item.nome || '') },
    { chave: 'vendaBossToken', secao: 'itens', nome: 'Boss Token', rotulo: 'Vender Boss Token', padrao: 'off', ehMatch: (item) => item.categoria === 'boss' || /boss token/i.test(item.nome || '') },
    { chave: 'vendaMysticTicket', secao: 'itens', nome: 'Mystic Ticket', rotulo: 'Vender Mystic Ticket', padrao: 'off', ehMatch: (item) => item.id === 70090 || /mystic ticket/i.test(item.nome || '') },
    { chave: 'vendaSafariTicket', secao: 'itens', nome: 'Safari Ticket', rotulo: 'Vender Safari Ticket', padrao: 'off', ehMatch: (item) => item.id === 70095 || /safari ticket/i.test(item.nome || '') },
    { chave: 'vendaBicicleta', secao: 'itens', nome: 'Bicicletas', rotulo: 'Vender Bicicletas', padrao: 'off', temRaridade: true, chaveRar: 'raridadeBicicleta', padraoRar: 'comum', ehMatch: (item) => item.categoria === 'bicicleta' || (/bicycle/i.test(item.nome || '') && !/fragment/i.test(item.nome || '')) },
    { chave: 'vendaCasa', secao: 'itens', nome: 'Casas', rotulo: 'Vender Casas', padrao: 'off', temRaridade: true, chaveRar: 'raridadeCasa', padraoRar: 'comum', ehMatch: (item) => item.categoria === 'casa' || (/house/i.test(item.nome || '') && !/fragment/i.test(item.nome || '')) },
    // Fragmentos (todos separados individualmente)
    { chave: 'vendaFragmentoAoe', secao: 'frags', nome: 'Fragmentos AoE', rotulo: 'Vender Fragmentos AoE', padrao: 'off', ehMatch: (item) => item.id === 40530 || /aoe/i.test(item.nome || '') },
    { chave: 'vendaFragmentoZmove', secao: 'frags', nome: 'Fragmentos Z-Move', rotulo: 'Vender Fragmentos Z-Move', padrao: 'off', ehMatch: (item) => item.id === 59194 || (/tm disk piece/i.test(item.nome || '') && !/aoe/i.test(item.nome || '')) || /z-?move/i.test(item.nome || '') },
    { chave: 'vendaFragmentoBike', secao: 'frags', nome: 'Frags de Bike', rotulo: 'Vender Frags de Bike', padrao: 'off', ehMatch: (item) => item.id === 70013 || (/bicycle/i.test(item.nome || '') && /fragment/i.test(item.nome || '')) },
    { chave: 'vendaFragmentoChave', secao: 'frags', nome: 'Frags de Chave', rotulo: 'Vender Frags de Chave', padrao: 'off', ehMatch: (item) => item.id === 70011 || /key fragment/i.test(item.nome || '') },
    { chave: 'vendaFragmentoMega', secao: 'frags', nome: 'Frags de Mega Stone', rotulo: 'Vender Frags de Mega Stone', padrao: 'off', ehMatch: (item) => item.id === 70014 || (/mega/i.test(item.nome || '') && !/shiny/i.test(item.nome || '') && /fragment|piece/i.test(item.nome || '')) },
    { chave: 'vendaFragmentoMegaShiny', secao: 'frags', nome: 'Frags de Mega Shiny', rotulo: 'Vender Frags de Mega Shiny', padrao: 'off', ehMatch: (item) => item.id === 70015 || (/mega/i.test(item.nome || '') && /shiny/i.test(item.nome || '')) },
    { chave: 'vendaFragmentoShinyStone', secao: 'frags', nome: 'Frags de Shiny Stone', rotulo: 'Vender Frags de Shiny Stone', padrao: 'off', ehMatch: (item) => item.id === 70012 || (!/mega/i.test(item.nome || '') && /shiny stone fragment/i.test(item.nome || '')) },
    { chave: 'vendaFragmentoShinyEgg', secao: 'frags', nome: 'Frags de Ovo Shiny', rotulo: 'Vender Frags de Ovo Shiny', padrao: 'off', ehMatch: (item) => item.id === 70017 || /shiny egg fragment|egg fragment/i.test(item.nome || '') },
  ]);

  const PADRAO = Object.freeze({
    radarLigado: false,
    intervaloS: 30,
    variacao: 0.2,
    pausarOculta: false,
    minutosOculta: 10,
    descontoMinimo: 0.25,
    lucroMinimo: 200000,
    volumeMinimo: 500,
    margemEnvioMs: 300,
    gastoMaximoPorCompra: 0, // 0: sem teto além do saldo
    som: true,
    notificacoes: true,
    alertarIliquidos: false,
    alertarPoucoConfiaveis: false,
    abrirPainelNoAviso: false, // 1.6: o aviso vira notificação curta; abrir o painel é opcional
    // Compra automática (Fase 2): desligada até o Allan ligar. Limites próprios, mais exigentes
    // que os do aviso; o gasto do dia conta só o que o automático comprou.
    compraAutomatica: false,
    descontoMinimoAuto: 0.3,
    lucroMinimoAuto: 50000,
    gastoMaximoAuto: 3000000, // por compra; 0: sem teto além do saldo
    gastoMaximoDia: 6000000, // por dia (meia-noite do PC); 0: sem teto
    // Pokémon (Fase 4): avisos ligados; a compra automática de pokémon tem caixa própria e divide
    // o teto do dia com os itens.
    pokemon: true,
    descontoMinimoPokemon: 0.7,
    lucroMinimoPokemon: 1000000, // depois dos 15% e de um dia de diária (100.000)
    compraAutomaticaPokemon: false,
    gastoMaximoPokemon: 10000000, // por pokémon; 0: sem teto além do saldo
    // Pokémon em Gemas: só análise (registro e CSV), nunca compra.
    pokemonGemas: true,
    lucroMinimoGemas: 100, // em Gemas (1 Gema = 0,01 USDT), já sem a comissão
    // Revenda automática de ITENS (piloto, 2026-10-19): anuncia sozinho, 1 abaixo do menor anúncio
    // de outro jogador e nunca abaixo do custo + 15%. Item não paga diária. Pokémon segue no clique.
    revendaAutomatica: false,
    revendaSoDoRadar: true, // só o que o radar comprou (desligado: também os seus drops vigiados)
    lucroMinimoRevenda: 20000,
    // Limites calculados sozinhos (Piloto 1.1): lucro mínimo pelo ouro/h, gasto pelo teto do cofre,
    // desconto do automático pela volatilidade de cada item. Desligado, valem os números acima.
    ajusteAutomatico: true,
    // Vigia contínua (1.7): varreduras seguidas, sem intervalo e sem pausa (o freio é o limitador).
    vigiaContinua: true,
    categorias: Object.freeze(['stone', 'fragment', 'boss', 'ticket', 'tm', 'mega', 'casa', 'bicicleta']),
    itensBloqueados: Object.freeze([]), // desligados à mão dentro de categoria ligada
    itensLiberados: Object.freeze([]), // ligados à mão em categoria desligada
    // 1.34 (pedido de um amigo do André, ok dele em 27/10): Alvos de compra do modo Manual — por item,
    // um teto em OURO e a quantidade máxima (0 = sem limite). Gema nunca.
    alvos: Object.freeze([]),
    // Pokémon em ouro (shiny só se vende em Gemas: fica de fora): P5 até um teto; nota mínima até um teto.
    alvosPk: Object.freeze({ p5: Object.freeze({ ligado: false, teto: 0 }), nota: Object.freeze({ ligado: false, corte: 4, teto: 0 }) }),
    // 1.53.10: seletor de 3 estados ('off' | 'orb' | 'gold') para cada grupo de itens.
    // Padrão 'off' para todos: nunca vende a menos que ativado. Quando ativado, padrão é Gemas ('orb').
    vendaPokemon: 'off',
    vendaStones: 'off',
    vendaBossToken: 'off',
    vendaMysticTicket: 'off',
    vendaSafariTicket: 'off',
    vendaBicicleta: 'off',
    raridadeBicicleta: 'comum',
    vendaCasa: 'off',
    raridadeCasa: 'comum',
    vendaFragmentoAoe: 'off',
    vendaFragmentoZmove: 'off',
    vendaFragmentoBike: 'off',
    vendaFragmentoChave: 'off',
    vendaFragmentoMega: 'off',
    vendaFragmentoMegaShiny: 'off',
    vendaFragmentoShinyStone: 'off',
    vendaFragmentoShinyEgg: 'off',
    vendaOutrosFragmentos: 'off',
    // Compatibilidade com versões anteriores:
    venderBossToken: false,
    moedaBossToken: 'orb',
    venderMysticTicket: false,
    moedaMysticTicket: 'orb',
    venderSafariTicket: false,
    moedaSafariTicket: 'orb',
  });
  const MAX_ALVOS = 30;
  function validarAlvos(v) {
    if (!Array.isArray(v)) return [];
    const out = [];
    const vistos = new Set();
    for (const a of v) {
      if (!a || typeof a !== 'object') continue;
      const itemId = Number(a.itemId);
      const teto = Math.floor(Number(a.teto));
      const max = Math.floor(Number(a.max));
      if (!Number.isInteger(itemId) || itemId < 1 || vistos.has(itemId)) continue;
      if (!Number.isFinite(teto) || teto < 2 || teto > 1e12) continue;
      vistos.add(itemId);
      const id = typeof a.id === 'string' && /^[a-z0-9-]{1,40}$/i.test(a.id) ? a.id : `a${itemId}`;
      out.push({ id, itemId, teto, max: Number.isFinite(max) && max > 0 ? Math.min(max, 1e7) : 0, ligado: a.ligado !== false });
      if (out.length >= MAX_ALVOS) break;
    }
    return out;
  }
  function validarAlvosPk(v) {
    const p = v && typeof v === 'object' ? v : {};
    const teto = (x) => { const n = Math.floor(Number(x)); return Number.isFinite(n) && n >= 0 && n <= 1e13 ? n : 0; };
    const p5 = p.p5 && typeof p.p5 === 'object' ? p.p5 : {};
    const nota = p.nota && typeof p.nota === 'object' ? p.nota : {};
    const corte = Number(nota.corte);
    return {
      p5: { ligado: p5.ligado === true, teto: teto(p5.teto) },
      nota: { ligado: nota.ligado === true, corte: Number.isFinite(corte) ? Math.min(10, Math.max(0, Math.round(corte * 10) / 10)) : 4, teto: teto(nota.teto) },
    };
  }

  const LIMITES = Object.freeze({
    intervaloS: [20, 3600],
    minutosOculta: [1, 240],
    // Abaixo de 15% a taxa come tudo: 16% é o mínimo que ainda dá algum lucro.
    descontoMinimo: [0.16, 0.9],
    lucroMinimo: [0, 1e12],
    volumeMinimo: [0, 1e9],
    margemEnvioMs: [100, 2000],
    gastoMaximoPorCompra: [0, 1e13],
    descontoMinimoAuto: [0.16, 0.9],
    lucroMinimoAuto: [0, 1e12],
    gastoMaximoAuto: [0, 1e13],
    gastoMaximoDia: [0, 1e13],
    descontoMinimoPokemon: [0.5, 0.9],
    lucroMinimoPokemon: [0, 1e12],
    gastoMaximoPokemon: [0, 1e13],
    lucroMinimoGemas: [0, 1e9],
    lucroMinimoRevenda: [0, 1e12],
  });

  function prender(v, [min, max], padrao) {
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v.replace(',', '.')) : v;
    if (typeof n !== 'number' || !Number.isFinite(n)) return padrao;
    return Math.min(max, Math.max(min, n));
  }

  function listaDeIds(v) {
    if (!Array.isArray(v)) return [];
    return [...new Set(v.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  }

  // Junta o que veio do storage (ou da tela de opções) com os padrões, dentro dos limites.
  function validar(parcial) {
    const p = parcial && typeof parcial === 'object' ? parcial : {};
    const c = { ...PADRAO };
    for (const chave of ['radarLigado', 'pausarOculta', 'som', 'notificacoes', 'alertarIliquidos', 'alertarPoucoConfiaveis', 'abrirPainelNoAviso', 'compraAutomatica', 'pokemon', 'compraAutomaticaPokemon', 'pokemonGemas', 'revendaAutomatica', 'revendaSoDoRadar', 'ajusteAutomatico', 'vigiaContinua', 'venderBossToken', 'venderMysticTicket', 'venderSafariTicket']) {
      if (typeof p[chave] === 'boolean') c[chave] = p[chave];
    }
    for (const chave of ['moedaBossToken', 'moedaMysticTicket', 'moedaSafariTicket']) {
      if (p[chave] === 'orb' || p[chave] === 'gold') c[chave] = p[chave];
    }
    // 1.53.10: validação do seletor de 3 estados ('off' | 'orb' | 'gold')
    for (const g of GRUPOS_VENDA) {
      const v = p[g.chave];
      if (v === 'off' || v === 'orb' || v === 'gold') c[g.chave] = v;
    }
    for (const k of ['raridadeBicicleta', 'raridadeCasa']) {
      if (typeof p[k] === 'string' && NIVEIS_RARIDADE.includes(p[k].toLowerCase())) {
        c[k] = p[k].toLowerCase();
      }
    }
    // Compatibilidade reversa: se não houver venda*, inferir dos campos legados
    if (p.vendaBossToken === undefined && typeof p.venderBossToken === 'boolean') {
      c.vendaBossToken = p.venderBossToken ? (p.moedaBossToken === 'gold' ? 'gold' : 'orb') : 'off';
    }
    if (p.vendaMysticTicket === undefined && typeof p.venderMysticTicket === 'boolean') {
      c.vendaMysticTicket = p.venderMysticTicket ? (p.moedaMysticTicket === 'gold' ? 'gold' : 'orb') : 'off';
    }
    if (p.vendaSafariTicket === undefined && typeof p.venderSafariTicket === 'boolean') {
      c.vendaSafariTicket = p.venderSafariTicket ? (p.moedaSafariTicket === 'gold' ? 'gold' : 'orb') : 'off';
    }
    // Stones e Pokémon: padrão estrito 'off' assim como todos os outros itens.
    // 1.53.13: as marcas da migração passam a ficar salvas na config. Antes elas eram descartadas
    // a cada gravação, o bloco antigo voltava a rodar e jogava Stones de volta para Off sozinho.
    if (p._v15311_ajustado !== true && p.vendaStones === 'orb' && !p._stonesManual) {
      c.vendaStones = 'off';
    }
    c._v15311_ajustado = true;
    if (p._stonesManual === true) c._stonesManual = true;
    // Mantém sincronizados os campos legados:
    c.venderBossToken = c.vendaBossToken !== 'off';
    c.moedaBossToken = c.vendaBossToken === 'gold' ? 'gold' : 'orb';
    c.venderMysticTicket = c.vendaMysticTicket !== 'off';
    c.moedaMysticTicket = c.vendaMysticTicket === 'gold' ? 'gold' : 'orb';
    c.venderSafariTicket = c.vendaSafariTicket !== 'off';
    c.moedaSafariTicket = c.vendaSafariTicket === 'gold' ? 'gold' : 'orb';
    c.revendaSoDoRadar = c.vendaStones === 'off';
    if (c.vendaPokemon === 'gold') {
      c.pokemon = true;
      c.pokemonGemas = false;
    } else if (c.vendaPokemon === 'orb') {
      c.pokemon = true;
      c.pokemonGemas = true;
    }
    for (const [chave, limite] of Object.entries(LIMITES)) c[chave] = prender(p[chave], limite, PADRAO[chave]);
    c.intervaloS = Math.round(c.intervaloS);
    c.minutosOculta = Math.round(c.minutosOculta);
    c.margemEnvioMs = Math.round(c.margemEnvioMs);
    c.variacao = c.vigiaContinua ? 0.1 : PADRAO.variacao;
    if (Array.isArray(p.categorias)) c.categorias = [...new Set(p.categorias.filter((x) => typeof x === 'string' && !CATEGORIAS_PROIBIDAS.includes(x)))];
    else c.categorias = [...PADRAO.categorias];
    c.itensBloqueados = listaDeIds(p.itensBloqueados);
    c.itensLiberados = listaDeIds(p.itensLiberados);
    c.alvos = validarAlvos(p.alvos);
    c.alvosPk = validarAlvosPk(p.alvosPk);
    return c;
  }

  const positivo = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

  // ---- limites calculados ------------------------------------------------------------------
  // ctx (publicado pelo Piloto, no mundo da página): { ouroH, teto } — o ouro/h medido e o teto do
  // dia do cofre. Sem ctx (Piloto ainda medindo), valem os pisos. O cofre continua sendo a trava
  // final de todo gasto: reserva, teto do dia somado e desligamento geral.
  const AUTO = Object.freeze({
    minLucroAuto: 20000, fracLucroAuto: 0.05, // ~3 min de farm
    minLucroAviso: 20000, fracLucroAviso: 0.03,
    minLucroRevenda: 10000, fracLucroRevenda: 0.02,
    minLucroPokemon: 500000, fracLucroPokemon: 0.5, // pokémon paga diária e é único: mais exigente
    fracPorCompra: 0.25, minPorCompra: 100000,
    fracPorPokemon: 0.5, minPorPokemon: 1000000,
    descontoBase: 0.25, descontoTeto: 0.5, pesoDispersao: 0.5, extraIliquido: 0.05,
    diasDeVolume: 2, // compra no máximo o que o mercado vende em ~2 dias
  });

  // Compra automática = as MESMAS regras do aviso (o que avisou, compra). O tamanho de cada compra é
  // o ouro livre do cofre agora (reserva e teto do dia já descontados). Pokémon mantém os números
  // dele (70% abaixo, 1 mi de lucro). Sem ctx (Piloto ainda medindo), valem os pisos.
  function calibrar(config, ctx) {
    if (!config || !config.ajusteAutomatico) return config;
    const c = { ...config, calibrada: true };
    const ouroH = ctx && positivo(ctx.ouroH) ? ctx.ouroH : 0;
    c.lucroMinimo = Math.max(AUTO.minLucroAviso, Math.round(ouroH * AUTO.fracLucroAviso));
    c.lucroMinimoAuto = c.lucroMinimo;
    c.descontoMinimoAuto = c.descontoMinimo;
    c.lucroMinimoRevenda = Math.max(AUTO.minLucroRevenda, Math.round(ouroH * AUTO.fracLucroRevenda));
    c.gastoMaximoPorCompra = 0;
    if (ctx && typeof ctx.livre === 'number' && Number.isFinite(ctx.livre)) {
      // 0 seria "sem teto" para o radar: sem folga no cofre, o teto vira 1 e nada passa.
      c.gastoMaximoDia = 0;
      c.gastoMaximoAuto = Math.max(1, Math.floor(ctx.livre));
      c.gastoMaximoPokemon = Math.max(1, Math.floor(ctx.livre));
    }
    return c;
  }

  // Mantidos por compatibilidade: o desconto do automático é o do aviso; sem teto por volume.
  function descontoAutoPara(av, config) {
    return config ? config.descontoMinimoAuto : AUTO.descontoBase;
  }
  function qtdPeloVolume() { return Infinity; }

  // Perfis do botão único. Só mexem nos interruptores; os números ficam com o ajuste automático.
  const PERFIS = Object.freeze({
    desligado: { radarLigado: false, compraAutomatica: false, compraAutomaticaPokemon: false, revendaAutomatica: false },
    manual: { radarLigado: true, compraAutomatica: false, compraAutomaticaPokemon: false, ajusteAutomatico: true }, // a revenda fica como está
    automatico: { radarLigado: true, compraAutomatica: true, compraAutomaticaPokemon: true, revendaAutomatica: true, ajusteAutomatico: true, pokemon: true, vigiaContinua: true, abrirPainelNoAviso: false, intervaloS: 30, pausarOculta: false, som: true, notificacoes: true },
  });

  // item: { id, categoria } do catálogo do welcome.
  function itemLiberado(config, item) {
    if (!item || CATEGORIAS_PROIBIDAS.includes(item.categoria)) return false;
    const id = Number(item.id);
    if (config.itensBloqueados.includes(id)) return false;
    if (config.itensLiberados.includes(id)) return true;
    return config.categorias.includes(item.categoria);
  }

  // 1.53.10: todos os itens do mercado pertencem a um grupo de venda em GRUPOS_VENDA.
  // Por padrão, nenhum item é revendido (estado 'off'). Só vende se configurado em 'orb' (Gemas) ou 'gold' (Ouro).
  const ITENS_PROTEGIDOS = GRUPOS_VENDA;

  function estadoVendaItem(config, item) {
    if (!item) return 'off';
    for (const g of GRUPOS_VENDA) {
      if (g.ehMatch(item)) {
        if (g.chave === 'vendaBicicleta' && !raridadePermitida(item, config && config.raridadeBicicleta)) {
          return 'off';
        }
        if (g.chave === 'vendaCasa' && !raridadePermitida(item, config && config.raridadeCasa)) {
          return 'off';
        }
        const val = config && config[g.chave];
        return val === 'orb' || val === 'gold' ? val : 'off';
      }
    }
    return 'off';
  }

  function itemVendavel(config, item) {
    return estadoVendaItem(config, item) !== 'off';
  }

  function moedaDoItem(config, item) {
    const est = estadoVendaItem(config, item);
    return est === 'gold' ? 'gold' : 'orb';
  }

  return { CHAVE, TAXA_VENDA, CATEGORIAS_PROIBIDAS, GRUPOS_VENDA, PADRAO, LIMITES, AUTO, PERFIS, MAX_ALVOS, ITENS_PROTEGIDOS, NIVEIS_RARIDADE, extrairRaridadeItem, raridadePermitida, validar, itemLiberado, estadoVendaItem, itemVendavel, moedaDoItem, calibrar, descontoAutoPara, qtdPeloVolume };
});
