import { PDFDocument, StandardFonts, rgb } from ‘pdf-lib’;

const ANTHROPIC_API_URL = ‘https://api.anthropic.com/v1/messages’;
const MODEL = ‘claude-sonnet-4-5’;

const C = {
rose:      rgb(0.91, 0.09, 0.43),
roseDark:  rgb(0.75, 0.06, 0.34),
noir:      rgb(0.10, 0.10, 0.10),
gris:      rgb(0.35, 0.35, 0.35),
grisClair: rgb(0.60, 0.60, 0.60),
blanc:     rgb(1, 1, 1),
fond:      rgb(0.97, 0.95, 0.96),
vert:      rgb(0.10, 0.55, 0.25),
orange:    rgb(0.85, 0.40, 0.05),
rouge:     rgb(0.75, 0.10, 0.10),
bleu:      rgb(0.08, 0.32, 0.65),
regle:     rgb(0.88, 0.88, 0.88),
};

const DEPT_NOMS = {
‘16’:‘Charente’,‘17’:‘Charente-Maritime’,‘19’:‘Correze’,‘23’:‘Creuse’,
‘24’:‘Dordogne’,‘33’:‘Gironde’,‘40’:‘Landes’,‘47’:‘Lot-et-Garonne’,
‘64’:‘Pyrenees-Atlantiques’,‘79’:‘Deux-Sevres’,‘86’:‘Vienne’,‘87’:‘Haute-Vienne’
};

function safeJsonParse(v) { try { return JSON.parse(v); } catch(e) { return null; } }

function pickText(c) {
if (!Array.isArray(c)) return ‘’;
return c.filter(function(b) { return b && b.type === ‘text’; }).map(function(b) { return b.text; }).join(’\n’);
}

function isElu(statut) {
return statut === ‘Victoire 1er Tour’ || statut === ‘Victoire 2nd Tour’;
}

function isQualifie(statut) {
if (!statut) return false;
return statut.indexOf(‘2nd Tour’) !== -1 && statut.indexOf(‘Victoire’) === -1;
}

function toAscii(text) {
if (!text) return ‘’;
return text
.replace(/\u00e9|\u00e8|\u00ea|\u00eb/g, ‘e’)
.replace(/\u00e0|\u00e2|\u00e4/g, ‘a’)
.replace(/\u00f9|\u00fb|\u00fc/g, ‘u’)
.replace(/\u00ee|\u00ef/g, ‘i’)
.replace(/\u00f4|\u00f6/g, ‘o’)
.replace(/\u00e7/g, ‘c’)
.replace(/\u00c9|\u00c8|\u00ca|\u00cb/g, ‘E’)
.replace(/\u00c0|\u00c2|\u00c4/g, ‘A’)
.replace(/\u00d9|\u00db|\u00dc/g, ‘U’)
.replace(/\u00ce|\u00cf/g, ‘I’)
.replace(/\u00d4|\u00d6/g, ‘O’)
.replace(/\u00c7/g, ‘C’)
.replace(/\u2019|\u2018/g, “’”)
.replace(/\u2013|\u2014/g, ‘-’)
.replace(/[^\x00-\x7F]/g, ‘?’);
}

function analyseParDeptPrompt(dept, deptNom, elusStr, qualsStr, communesStr) {
return ‘Tu es analyste politique expert des elections municipales 2026 en Nouvelle-Aquitaine pour le Groupe Socialiste.\n\n’
+ ‘Departement : ’ + deptNom + ’ (’ + dept + ‘)\n’
+ ’CR elus : ’ + (elusStr || ‘aucun’) + ‘\n’
+ ’CR qualifies 2T : ’ + (qualsStr || ‘aucun’) + ‘\n’
+ ’Communes cles du departement : ’ + (communesStr || ‘non specifie’) + ‘\n\n’
+ ‘En recherchant sur le web les resultats des municipales 2026 dans ce departement, redige une analyse de 6 a 8 phrases en ASCII (sans accents) couvrant :\n’
+ ‘1. Situation generale du departement a la lecture des resultats\n’
+ ‘2. Resultats dans les communes cles et explication (degagisme, prime au sortant, personnalite clivante)\n’
+ ‘3. Strategie du RN dans ce departement : rupture avec l'anti-UMPS, union des droites, vote strategique des electeurs RN, emergence d'un front anti-gauche symetrique au front republicain\n’
+ ‘4. Perspectives pour le 2nd tour et enjeux pour le groupe PS/PP\n\n’
+ ‘Reponds uniquement avec le texte de l'analyse, en ASCII pur, sans titre ni bullet points.’;
}

async function analyseParDept(dept, crsElus, crsQuals, communesStr, apiKey) {
const deptNom = DEPT_NOMS[dept] || dept;
const elusStr = crsElus.map(function(c) {
return c.nom + (c.commune ? ’ (’ + c.commune + ‘)’ : ‘’) + (c.s1 ? ’ ’ + c.s1 + ‘%’ : ‘’);
}).join(’, ‘);
const qualsStr = crsQuals.map(function(c) {
return c.nom + (c.commune ? ’ (’ + c.commune + ‘)’ : ‘’);
}).join(’, ’);

try {
const response = await fetch(ANTHROPIC_API_URL, {
method: ‘POST’,
headers: {
‘content-type’: ‘application/json’,
‘x-api-key’: apiKey,
‘anthropic-version’: ‘2023-06-01’
},
body: JSON.stringify({
model: MODEL,
max_tokens: 600,
temperature: 0.3,
tools: [{ type: ‘web_search_20250305’, name: ‘web_search’ }],
messages: [{ role: ‘user’, content: analyseParDeptPrompt(dept, deptNom, elusStr, qualsStr, communesStr) }]
})
});
if (!response.ok) return null;
const json = await response.json();
const text = pickText(json.content);
return text && text.length > 50 ? toAscii(text).substring(0, 900) : null;
} catch(e) {
console.warn(’Analyse dept ’ + dept + ’: ’ + e.message);
return null;
}
}

async function callAnthropic(data) {
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error(‘ANTHROPIC_API_KEY manquante’);
const elus = (data.crs || []).filter(function(c) { return isElu(c.statut); });
const quals = (data.crs || []).filter(function(c) { return isQualifie(c.statut); });

const prompt = ‘Tu es redacteur institutionnel pour le Groupe Socialiste du Conseil Regional de Nouvelle-Aquitaine.\n\n’
+ ‘Redige la note d'analyse de synthese nationale.\n’
+ ‘DONNEES: Stats=’ + JSON.stringify(data.stats)
+ ’ Blocs=’ + JSON.stringify(data.blocs)
+ ’ Elus(’ + elus.length + ‘)=’ + JSON.stringify(elus.slice(0, 30).map(function(c) { return { nom: c.nom, dept: c.dept, score: c.s1 }; }))
+ ’ Qualifies(’ + quals.length + ‘)=’ + JSON.stringify(quals.slice(0, 20).map(function(c) { return { nom: c.nom, dept: c.dept }; }))
+ ‘\n\nCONSIGNES: ASCII uniquement, tonalite institutionnelle, citer les elus emblematiques, analyser la dynamique RN (union des droites, vote strategique, front anti-gauche), ne pas inventer.\n\n’
+ ‘FORMAT JSON STRICT sans markdown:\n’
+ ‘{“titre”:“string”,“sous_titre”:“string”,“resume_executif”:[“s”,“s”,“s”],“faits_marquants”:[“s”,“s”,“s”,“s”],“analyse_blocs”:[{“bloc”:“s”,“engages”:0,“elus”:0,“qualifies”:0,“defaites”:0}],“points_attention”:[“s”,“s”,“s”]}’;

const response = await fetch(ANTHROPIC_API_URL, {
method: ‘POST’,
headers: { ‘content-type’: ‘application/json’, ‘x-api-key’: apiKey, ‘anthropic-version’: ‘2023-06-01’ },
body: JSON.stringify({ model: MODEL, max_tokens: 2000, temperature: 0.2, messages: [{ role: ‘user’, content: prompt }] }),
});
if (!response.ok) throw new Error(’Anthropic ’ + response.status);
const json = await response.json();
const text = pickText(json.content);
const clean = text.replace(/`json|`/g, ‘’).trim();
const parsed = safeJsonParse(clean);
if (!parsed) throw new Error(‘Non parseable’);
return parsed;
}

function buildFallbackAnalysis(data) {
const stats = data.stats || {};
const blocs = data.blocs || [];
const depts = data.depts || [];
const totalElus = (stats.e1 || 0) + (stats.e2 || 0);
const blocPSPP = blocs.find(function(b) { return b.bloc && (b.bloc.indexOf(‘PS’) !== -1 || b.bloc.indexOf(‘PP’) !== -1); });
const dept33 = depts.find(function(d) { return d.dept === ‘33’; }) || {};
const dept64 = depts.find(function(d) { return d.dept === ‘64’; }) || {};
return {
titre: “Note d’analyse - Resultats municipaux 2026”,
sous_titre: “Groupe Socialiste, Place Publique & Apparentes - Conseil Regional Nouvelle-Aquitaine”,
resume_executif: [
‘Sur ’ + (stats.total || 0) + ’ conseillers regionaux suivis, ’ + totalElus + ’ ont remporte leur election (’ + (stats.e1 || 0) + ’ des le 1er tour), ’ + (stats.ball || 0) + ’ sont qualifies pour le 2nd tour.’,
‘Le groupe PS/PP totalise ’ + (blocPSPP ? (blocPSPP.victoires_1t || 0) + (blocPSPP.victoires_2t || 0) : totalElus) + ’ victoires et ’ + (blocPSPP ? blocPSPP.qualifies_2t || 0 : stats.ball || 0) + ’ qualifications.’,
‘Fait marquant : le RN abandonne la strategie anti-UMPS au profit de l'union des droites, revelant un electorat capable de vote strategique et l'emergence d'un front anti-gauche inedit.’,
],
faits_marquants: [
‘Gironde (33) : ’ + (dept33.victoires_1t || 0) + ’ victoires au 1er tour.’,
‘Pyrenees-Atlantiques (64) : ’ + (dept64.qualifies_2t || 0) + ’ CR qualifies pour le 2nd tour.’,
‘Le RN pratique l'union des droites : ses electeurs votent strategique, creant un miroir du front republicain.’,
(stats.ball || 0) + ’ conseillers encore en lice pour le 2nd tour.’,
],
analyse_blocs: blocs.filter(function(b) { return (b.engages || 0) > 0; }).map(function(b) {
return { bloc: b.bloc, engages: b.engages || 0, elus: (b.victoires_1t || 0) + (b.victoires_2t || 0), qualifies: b.qualifies_2t || 0, defaites: (b.defaites_1t || 0) + (b.defaites_2t || 0) };
}),
points_attention: [
(stats.ball || 0) > 0 ? ((stats.ball || 0) + ’ conseillers encore en lice pour le 2nd tour.’) : null,
‘Surveiller les communes ou le RN a opte pour l'union des droites.’,
‘Actualiser apres le 2nd tour pour une synthese definitive.’,
].filter(Boolean),
};
}

function wrapText(text, font, size, maxWidth) {
const words = String(text || ‘’).split(/\s+/).filter(Boolean);
const lines = [];
let cur = ‘’;
for (let i = 0; i < words.length; i++) {
const w = words[i];
const cand = cur ? cur + ’ ’ + w : w;
if (font.widthOfTextAtSize(cand, size) <= maxWidth) { cur = cand; }
else { if (cur) lines.push(cur); cur = w; }
}
if (cur) lines.push(cur);
return lines.length ? lines : [’’];
}

async function buildPdf(analysis, deptData, meta) {
meta = meta || {};
const pdfDoc = await PDFDocument.create();
const W = 595.28, H = 841.89, M = 44, CW = W - M * 2;
const fR = await pdfDoc.embedFont(StandardFonts.Helvetica);
const fB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
const fI = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
let page, y;
const genDate = new Date(meta.generatedAt || Date.now()).toLocaleString(‘fr-FR’);

function drawHeader() {
page.drawRectangle({ x: 0, y: H - 52, width: W, height: 52, color: C.rose });
page.drawText(‘MUNICIPALES 2026’, { x: M, y: H - 22, size: 13, font: fB, color: C.blanc });
page.drawText(‘Groupe Socialiste, Place Publique & Apparentes - Nouvelle-Aquitaine’, { x: M, y: H - 38, size: 8, font: fR, color: rgb(1, 0.85, 0.92) });
const ds = ’Genere le : ’ + genDate;
page.drawText(ds, { x: W - M - fR.widthOfTextAtSize(ds, 8), y: H - 38, size: 8, font: fR, color: rgb(1, 0.85, 0.92) });
page.drawRectangle({ x: 0, y: H - 54, width: W, height: 2, color: C.roseDark });
y = H - 68;
}

function newPage() { page = pdfDoc.addPage([W, H]); drawHeader(); }
function ensureY(n) { if (y - n < M + 30) newPage(); }

function secTitle(t) {
ensureY(32);
y -= 8;
page.drawRectangle({ x: M, y: y - 2, width: 3, height: 16, color: C.rose });
page.drawText(t.toUpperCase(), { x: M + 10, y: y, size: 9, font: fB, color: C.rose });
y -= 18;
page.drawLine({ start: { x: M, y: y }, end: { x: M + CW, y: y }, thickness: 0.5, color: C.regle });
y -= 8;
}

function drawTxt(text, opts) {
opts = opts || {};
const font = opts.font || fR;
const size = opts.size || 9.5;
const color = opts.color || C.noir;
const leading = opts.leading || 14;
const bullet = opts.bullet || false;
const indent = opts.indent || 0;
const off = bullet ? 12 : 0;
const lines = wrapText(text, font, size, CW - indent - off);
for (let i = 0; i < lines.length; i++) {
ensureY(leading);
if (bullet && i === 0) page.drawText(’-’, { x: M + indent, y: y, size: size, font: fB, color: C.rose });
page.drawText(lines[i], { x: M + indent + off, y: y, size: size, font: font, color: color });
y -= leading;
}
}

// PAGE 1 SYNTHESE
page = pdfDoc.addPage([W, H]);
drawHeader();
page.drawText(analysis.titre || “Note d’analyse - Resultats municipaux 2026”, { x: M, y: y, size: 15, font: fB, color: C.noir });
y -= 18;
page.drawText(analysis.sous_titre || ‘’, { x: M, y: y, size: 8.5, font: fI, color: C.gris });
y -= 22;

const stats = meta.stats || {};
const cards = [
{ label: ‘VICTOIRES 1T’, val: stats.e1 || 0, bg: C.vert },
{ label: ‘VICTOIRES 2T’, val: stats.e2 || 0, bg: rgb(0.05, 0.45, 0.20) },
{ label: ‘QUALIFIES 2T’, val: stats.ball || 0, bg: C.orange },
{ label: ‘DEFAITES’, val: stats.def || 0, bg: C.rouge },
{ label: ‘CR SUIVIS’, val: stats.total || 0, bg: C.bleu },
];
const cW = (CW - 16) / 5, cH = 50;
for (let i = 0; i < cards.length; i++) {
const c = cards[i];
const cx = M + i * (cW + 4);
page.drawRectangle({ x: cx, y: y - cH, width: cW, height: cH, color: c.bg, borderRadius: 4 });
const vs = String(c.val);
page.drawText(vs, { x: cx + (cW - fB.widthOfTextAtSize(vs, 20)) / 2, y: y - cH + 24, size: 20, font: fB, color: C.blanc });
page.drawText(c.label, { x: cx + (cW - fR.widthOfTextAtSize(c.label, 6.5)) / 2, y: y - cH + 8, size: 6.5, font: fR, color: C.blanc });
}
y -= cH + 16;

secTitle(‘Resume executif’);
const resumeItems = analysis.resume_executif || [];
for (let i = 0; i < resumeItems.length; i++) { drawTxt(resumeItems[i], { bullet: true }); y -= 2; }

const faitsItems = analysis.faits_marquants || [];
if (faitsItems.length) {
secTitle(‘Faits marquants’);
for (let i = 0; i < faitsItems.length; i++) { drawTxt(faitsItems[i], { bullet: true }); y -= 2; }
}

secTitle(‘Resultats par bloc politique’);
const colXs = [M, M + 160, M + 210, M + 265, M + 325];
const rowH = 16;
ensureY(20);
page.drawRectangle({ x: M, y: y - rowH + 4, width: CW, height: rowH, color: C.fond });
const hdrs = [‘Bloc politique’, ‘Engages’, ‘Elus’, ‘Qualifies’, ‘Defaites’];
for (let i = 0; i < hdrs.length; i++) {
page.drawText(hdrs[i], { x: colXs[i] + 4, y: y - rowH + 8, size: 7.5, font: fB, color: C.roseDark });
}
y -= rowH + 2;
const blocsData = (analysis.analyse_blocs || []).filter(function(b) { return b.engages > 0; });
for (let idx = 0; idx < blocsData.length; idx++) {
const b = blocsData[idx];
ensureY(rowH);
if (idx % 2 === 0) page.drawRectangle({ x: M, y: y - rowH + 4, width: CW, height: rowH, color: rgb(0.97, 0.97, 0.97) });
const vals = [b.bloc, String(b.engages), String(b.elus), String(b.qualifies), String(b.defaites)];
const colors = [C.noir, C.gris, b.elus > 0 ? C.vert : C.gris, b.qualifies > 0 ? C.orange : C.gris, b.defaites > 0 ? C.rouge : C.gris];
for (let i = 0; i < vals.length; i++) {
page.drawText(vals[i], { x: colXs[i] + 4, y: y - rowH + 8, size: i === 0 ? 8 : 8.5, font: i === 0 ? fR : fB, color: colors[i] });
}
y -= rowH;
}
y -= 8;

const attentionItems = analysis.points_attention || [];
if (attentionItems.length) {
secTitle(“Points d’attention”);
for (let i = 0; i < attentionItems.length; i++) { drawTxt(attentionItems[i], { bullet: true, color: C.gris }); y -= 2; }
}

// PAGES ANALYSE PAR DEPARTEMENT
for (let di = 0; di < deptData.length; di++) {
const d = deptData[di];
newPage();

```
page.drawRectangle({ x: 0, y: H - 90, width: W, height: 38, color: rgb(0.12, 0.12, 0.12) });
page.drawText(d.dept, { x: M, y: H - 72, size: 13, font: fB, color: C.blanc });
page.drawText(d.stats, { x: M, y: H - 84, size: 8, font: fR, color: C.grisClair });
y = H - 102;

if (d.elus.length > 0) {
  secTitle('Conseillers regionaux elus');
  for (let i = 0; i < d.elus.length; i++) {
    ensureY(14);
    page.drawText('v', { x: M + 4, y: y, size: 9, font: fB, color: C.vert });
    page.drawText(d.elus[i], { x: M + 18, y: y, size: 9, font: fB, color: C.noir });
    y -= 14;
  }
  y -= 4;
}

if (d.qualifies.length > 0) {
  secTitle('Qualifies pour le 2nd tour');
  for (let i = 0; i < d.qualifies.length; i++) {
    ensureY(14);
    page.drawText('>', { x: M + 4, y: y, size: 9, font: fB, color: C.orange });
    page.drawText(d.qualifies[i], { x: M + 18, y: y, size: 9, font: fR, color: C.noir });
    y -= 14;
  }
  y -= 4;
}

if (d.analyse) {
  secTitle('Analyse politique departementale');
  drawTxt(d.analyse, { font: fR, size: 9, color: C.noir, leading: 14 });
}
```

}

const pages = pdfDoc.getPages();
for (let i = 0; i < pages.length; i++) {
const pg = pages[i];
pg.drawLine({ start: { x: M, y: 28 }, end: { x: W - M, y: 28 }, thickness: 0.5, color: C.regle });
pg.drawText(‘Genere le ’ + genDate + ’ - Application Municipales 2026 NA’, { x: M, y: 16, size: 7, font: fR, color: C.grisClair });
const ps = ’Page ’ + (i + 1) + ’ / ’ + pages.length;
pg.drawText(ps, { x: W - M - fR.widthOfTextAtSize(ps, 7), y: 16, size: 7, font: fR, color: C.grisClair });
}

return pdfDoc.save();
}

export default async function handler(req, res) {
if (req.method !== ‘POST’) {
res.setHeader(‘Allow’, ‘POST’);
return res.status(405).json({ error: ‘Method not allowed’ });
}
try {
const data = typeof req.body === ‘string’ ? JSON.parse(req.body) : req.body;
if (!data || !data.stats) return res.status(400).json({ error: ‘Payload incomplet’ });

```
const apiKey = process.env.ANTHROPIC_API_KEY;
const crs = data.crs || [];
const depts = data.depts || [];

const elusByCR = crs.filter(function(c) { return isElu(c.statut); });
const qualsByCR = crs.filter(function(c) { return isQualifie(c.statut); });
const elusByDept = {}, qualsByDept = {}, crsByDept = {};

elusByCR.forEach(function(c) {
  if (!elusByDept[c.dept]) elusByDept[c.dept] = [];
  const label = c.nom + (c.groupe ? ' [' + c.groupe + ']' : '') + (c.commune ? ' (' + c.commune + ')' : '') + (c.s1 ? ' - ' + c.s1 + '%' : '');
  elusByDept[c.dept].push(label);
  if (!crsByDept[c.dept]) crsByDept[c.dept] = { elus: [], quals: [] };
  crsByDept[c.dept].elus.push(c);
});
qualsByCR.forEach(function(c) {
  if (!qualsByDept[c.dept]) qualsByDept[c.dept] = [];
  const label = c.nom + (c.groupe ? ' [' + c.groupe + ']' : '') + (c.commune ? ' (' + c.commune + ')' : '');
  qualsByDept[c.dept].push(label);
  if (!crsByDept[c.dept]) crsByDept[c.dept] = { elus: [], quals: [] };
  crsByDept[c.dept].quals.push(c);
});

const deptsSorted = depts.slice().sort(function(a, b) {
  return ((b.victoires_1t || 0) + (b.victoires_2t || 0) + (b.qualifies_2t || 0)) -
         ((a.victoires_1t || 0) + (a.victoires_2t || 0) + (a.qualifies_2t || 0));
});

const deptsActifs = deptsSorted.filter(function(d) {
  return (elusByDept[d.dept] || []).length > 0 || (qualsByDept[d.dept] || []).length > 0;
});

const analyseGlobalePromise = callAnthropic(data).catch(function() { return buildFallbackAnalysis(data); });

const analysesDeptsPromises = deptsActifs.map(function(d) {
  if (!apiKey) return Promise.resolve(null);
  const crsD = crsByDept[d.dept] || { elus: [], quals: [] };
  const communesStr = d.communes_cles ? d.communes_cles.join(', ') : '';
  return analyseParDept(d.dept, crsD.elus, crsD.quals, communesStr, apiKey).catch(function() { return null; });
});

const allResults = await Promise.allSettled([analyseGlobalePromise].concat(analysesDeptsPromises));

const analysis = allResults[0].status === 'fulfilled' ? allResults[0].value : buildFallbackAnalysis(data);

const deptData = deptsActifs.map(function(d, idx) {
  const analyseResult = allResults[idx + 1];
  const analyseText = analyseResult && analyseResult.status === 'fulfilled' ? analyseResult.value : null;
  return {
    dept: d.dept + ' - ' + (DEPT_NOMS[d.dept] || d.departement || d.dept),
    elus: elusByDept[d.dept] || [],
    qualifies: qualsByDept[d.dept] || [],
    stats: ((d.victoires_1t || 0) + (d.victoires_2t || 0)) + ' elus - ' + (d.qualifies_2t || 0) + ' qualifies - ' + (d.defaites || 0) + ' defaites',
    analyse: analyseText || ('Analyse indisponible pour ' + (DEPT_NOMS[d.dept] || d.dept) + '.'),
  };
});

const pdfBytes = await buildPdf(analysis, deptData, {
  generatedAt: data.generatedAt,
  stats: data.stats,
});

const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', 'attachment; filename="Municipales2026_NA_Analyse_' + date + '.pdf"');
return res.status(200).send(Buffer.from(pdfBytes));
```

} catch(error) {
console.error(‘PDF generation error:’, error);
return res.status(500).json({ error: error.message || ‘Erreur serveur’ });
}
}