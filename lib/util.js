// Funções puras usadas pelo site e pelo painel.
(function (root) {
  // Escapa texto antes de entrar no HTML (nunca confie em dado vindo do banco).
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function brl(n) {
    if (n === null || n === undefined || n === '' || isNaN(Number(n))) return '';
    return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  // Só aceita foto do próprio projeto/pasta ou data URI de imagem — evita javascript: e hosts estranhos.
  function fotoSegura(url) {
    if (!url) return '';
    var u = String(url);
    if (/^img\/[\w\-./]+$/.test(u)) return u;
    if (/^https:\/\/[\w-]+\.supabase\.co\/storage\/v1\/object\/public\/perfumes\//.test(u)) return u;
    return '';
  }
  function mensagemPedido(p) {
    var l = ['Olá, Haya! Quero este perfume:', '', p.nome + (p.marca ? ' — ' + p.marca : '')];
    if (p.tamanho) l.push('Tamanho: ' + p.tamanho);
    if (p.preco != null && p.preco !== '') l.push('Valor: ' + brl(p.preco));
    return l.join('\n');
  }
  function linkWhatsApp(numero, texto) {
    var d = String(numero || '').replace(/\D/g, '');
    return d.length >= 12 ? 'https://wa.me/' + d + '?text=' + encodeURIComponent(texto) : '';
  }
  function normaliza(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
  var api = { esc: esc, brl: brl, fotoSegura: fotoSegura, mensagemPedido: mensagemPedido, linkWhatsApp: linkWhatsApp, normaliza: normaliza };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.HayaUtil = api;
})(typeof window !== 'undefined' ? window : globalThis);
