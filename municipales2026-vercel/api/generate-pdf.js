import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

const C = {
  rose:     rgb(0.91, 0.09, 0.43),
  roseDark: rgb(0.75, 0.06, 0.34),
  noir:     rgb(0.10, 0.10, 0.10),
  gris:     rgb(0.35, 0.35, 0.35),
  grisClair:rgb(0.60, 0.60, 0.60),
  blanc:    rgb(1, 1, 1),
  fond:     rgb(0.97, 0.95, 0.96),
  vert:     rgb(0.10, 0.55, 0.25),
  vertClair:rgb(0.88, 0.96, 0.90),
  orange:   rgb(0.85, 0.40, 0.05),
  orangeClair:rgb(0.98, 0.92, 0.84),
  rouge:    rgb(0.75, 0.10, 0.10),
  rougeClair:rgb(0.98, 0.88, 0.88),
  bleu:     rgb(0.08, 0.32, 0.65),
  regle:    rgb(0.88, 0.88, 0.88),
};

function safeJsonParse(v) { try { return JSON.parse(v); } catch { return null; } }
function pickText(c) {
  if (!Array.isArray(c)) return '';
  return c.filter(b => b?.type === 'text').map(b => b.text).join('\n');
}

function buildFallbackAnalysis(data) {
  const { stats = {}, blocs = [], depts = [], crs = [] } = data;
  const elus = (crs||[]).filter(c => c.statut==='Victoire 1er Tour'||c.statut==='Victoire 2nd Tour');
  const quals = (crs||[]).filter(c => c.statut==='Qualifie pour le 2nd Tour'||c.statut==='Qualifié·e pour le 2nd Tour');
  const elusByDept = {}, qualsByDept = {};
  elus.forEach(c => { if(!elusByDept[c.dept]) elusByDept[c.dept]=[]; elusByDept[c.dept].push(c.nom+(c.commune?` (${c.commune})`:''));});
  quals.forEach(c => { if(!qualsByDept[c.dept]) qualsByDept[c.dept]=[]; qualsByDept[c.dept].push(c.nom+(c.commune?` (${c.commune})`:''));});
  const totalElus=(stats.e1||0)+(stats.e2||0);
  const totalQual=stats.ball||0;
  const totalDef=stats.def||0;
  const blocPSPP=blocs.find(b=>b.bloc?.includes('PS')||b.bloc?.includes('PP'));
  const deptsSorted=[...depts].sort((a,b)=>((b.victoires_1t||0)+(b.victoires_2t||0)+(b.qualifies_2t||0))-((a.victoires_1t||0)+(a.victoires_2t||0)+(a.qualifies_2t||0)));
  return {
    titre: "Note d'analyse - Resultats municipaux 2026",
    sous_titre: "Groupe Socialiste, Place Publique & Apparentes - Conseil Regional Nouvelle-Aquitaine",
    resume_executif: [
      `Sur ${stats.total||0} conseillers regionaux suivis, ${totalElus} ont remporte leur election (${stats.e1||0} des le 1er tour), ${totalQual} sont qualifies pour le 2nd tour et ${totalDef} ont ete battus.`,
      `Le groupe PS/PP et apparentes totalise ${blocPSPP?(blocPSPP.victoires_1t||0)+(blocPSPP.victoires_2t||0):totalElus} victoires et ${blocPSPP?(blocPSPP.qualifies_2t||0):totalQual} qualifications au 2nd tour.`,
      `La photographie reste evolutive selon les resultats du 2nd tour a venir.`,
    ],
    faits_marquants: [
      `Gironde (33) : bilan positif avec ${(depts.find(d=>d.dept==='33')?.victoires_1t||0)} victoires au 1er tour.`,
      `Pyrenees-Atlantiques (64) : ${(depts.find(d=>d.dept==='64')?.qualifies_2t||0)} CR qualifies pour le 2nd tour.`,
      `Le bloc PS/PP reste le groupe le plus represente avec ${blocPSPP?.engages||0} candidats engages.`,
      `${totalQual} conseillers regionaux sont encore en lice pour le 2nd tour.`,
    ],
    analyse_blocs: blocs.filter(b=>(b.engages||0)>0).map(b=>({
      bloc: b.bloc,
      engages: b.engages||0,
      elus: (b.victoires_1t||0)+(b.victoires_2t||0),
      qualifies: b.qualifies_2t||0,
      defaites: (b.defaites_1t||0)+(b.defaites_2t||0),
    })),
    elus_par_dept: deptsSorted.slice(0,12).map(d=>({
      dept: `${d.dept} - ${d.departement}`,
      elus: elusByDept[d.dept]||[],
      qualifies: qualsByDept[d.dept]||[],
      stats: `${(d.victoires_1t||0)+(d.victoires_2t||0)} elus - ${d.qualifies_2t||0} qualifies - ${d.defaites||0} defaites`,
    })),
    points_attention: [
      totalQual>0 ? `${totalQual} conseillers sont encore en lice pour le 2nd tour.` : null,
      "Verifier les communes a fort enjeu encore sans resultat saisi.",
      "Actualiser la note apres le 2nd tour pour une synthese definitive.",
    ].filter(Boolean),
  };
}

async function callAnthropic(data) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante');
  const elus = (data.crs||[]).filter(c=>c.statut==='Victoire 1er Tour'||c.statut==='Victoire 2nd Tour').map(c=>({nom:c.nom,commune:c.commune,dept:c.dept,groupe:c.groupe,score:c.s1}));
  const quals = (data.crs||[]).filter(c=>c.statut&&c.statut.includes('2nd Tour')&&!c.statut.includes('Victoire')).map(c=>({nom:c.nom,commune:c.commune,dept:c.dept}));
  const prompt = `Tu es redacteur institutionnel pour le Groupe Socialiste, Place Publique & Apparentes du Conseil Regional de Nouvelle-Aquitaine.

Redige une note d'analyse politique CONCISE des resultats municipaux 2026 en Nouvelle-Aquitaine.

DONNEES :
- Stats : ${JSON.stringify(data.stats)}
- Blocs : ${JSON.stringify(data.blocs)}
- Depts : ${JSON.stringify(data.depts)}
- CR elus (${elus.length}) : ${JSON.stringify(elus.slice(0,30))}
- CR qualifies 2T (${quals.length}) : ${JSON.stringify(quals.slice(0,20))}

CONSIGNES :
- Tonalite institutionnelle sobre, valorisant le bilan du groupe
- Citer les noms des elus les plus emblematiques
- Mettre en valeur les victoires nettes au 1er tour
- Identifier les enjeux du 2nd tour
- N'utiliser QUE des caracteres ASCII simples (pas d'accents, pas de caracteres speciaux, pas d'apostrophes courbes)
- Ne jamais inventer de resultat absent des donnees

FORMAT JSON STRICT (sans balises markdown, ASCII uniquement) :
{
  "titre": "Note d'analyse - Resultats municipaux 2026",
  "sous_titre": "Groupe Socialiste, Place Publique & Apparentes - Conseil Regional Nouvelle-Aquitaine",
  "resume_executif": ["string","string","string"],
  "faits_marquants": ["string","string","string","string"],
  "analyse_blocs": [{"bloc":"string","engages":0,"elus":0,"qualifies":0,"defaites":0}],
  "elus_par_dept": [{"dept":"XX - Nom","elus":["Nom (Commune)"],"qualifies":["Nom (Commune)"],"stats":"string"}],
  "points_attention": ["string","string","string"]
}`;
  const response = await fetch(ANTHROPIC_API_URL, {
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},
    body: JSON.stringify({model:MODEL,max_tokens:2500,temperature:0.2,messages:[{role:'user',content:prompt}]}),
  });
  if (!response.ok) throw new Error(`Anthropic ${response.status}`);
  const json = await response.json();
  const text = pickText(json.content);
  const clean = text.replace(/```json|```/g,'').trim();
  const parsed = safeJsonParse(clean);
  if (!parsed) throw new Error('Non parseable');
  return parsed;
}

function wrapText(text, font, size, maxWidth) {
  const words = String(text||'').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(cand, size) <= maxWidth) { cur = cand; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

async function buildPdf(analysis, meta = {}) {
  const pdfDoc = await PDFDocument.create();
  const W = 595.28, H = 841.89, M = 44;
  const CW = W - M * 2;
  const fR = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fI = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page, y;

  const drawHeader = () => {
    page.drawRectangle({x:0, y:H-52, width:W, height:52, color:C.rose});
    page.drawText('MUNICIPALES 2026', {x:M, y:H-22, size:13, font:fB, color:C.blanc});
    page.drawText('Groupe Socialiste, Place Publique & Apparentes - Nouvelle-Aquitaine', {x:M, y:H-38, size:8, font:fR, color:rgb(1,0.85,0.92)});
    const ds = `Mis a jour : ${meta.lastUpd||''}`;
    page.drawText(ds, {x:W-M-fR.widthOfTextAtSize(ds,8), y:H-38, size:8, font:fR, color:rgb(1,0.85,0.92)});
    page.drawRectangle({x:0, y:H-54, width:W, height:2, color:C.roseDark});
    y = H - 68;
  };

  const newPage = () => {
    page = pdfDoc.addPage([W,H]);
    drawHeader();
  };

  const ensureY = (n) => { if (y - n < M + 30) newPage(); };

  const secTitle = (t) => {
    ensureY(32);
    y -= 8;
    page.drawRectangle({x:M, y:y-2, width:3, height:16, color:C.rose});
    page.drawText(t.toUpperCase(), {x:M+10, y, size:9, font:fB, color:C.rose});
    y -= 18;
    page.drawLine({start:{x:M,y}, end:{x:M+CW,y}, thickness:0.5, color:C.regle});
    y -= 8;
  };

  const drawTxt = (text, opts={}) => {
    const {font=fR, size=9.5, color=C.noir, leading=14, bullet=false, indent=0} = opts;
    const off = bullet ? 12 : 0;
    const lines = wrapText(text, font, size, CW-indent-off);
    lines.forEach((line, i) => {
      ensureY(leading);
      if (bullet && i===0) page.drawText('-', {x:M+indent, y, size, font:fB, color:C.rose});
      page.drawText(line, {x:M+indent+off, y, size, font, color});
      y -= leading;
    });
  };

  // ── PAGE 1 ──────────────────────────────────────────────────────────────
  page = pdfDoc.addPage([W,H]);
  drawHeader();

  // Titre
  page.drawText(analysis.titre||"Note d'analyse - Resultats municipaux 2026", {x:M, y, size:15, font:fB, color:C.noir});
  y -= 18;
  page.drawText(analysis.sous_titre||'', {x:M, y, size:8.5, font:fI, color:C.gris});
  y -= 22;

  // Cards stats
  const stats = meta.stats||{};
  const cards = [
    {label:'VICTOIRES 1T', val:stats.e1||0, bg:C.vert},
    {label:'VICTOIRES 2T', val:stats.e2||0, bg:rgb(0.05,0.45,0.20)},
    {label:'QUALIFIES 2T', val:stats.ball||0, bg:C.orange},
    {label:'DEFAITES',     val:stats.def||0,  bg:C.rouge},
    {label:'CR SUIVIS',    val:stats.total||0, bg:C.bleu},
  ];
  const cW = (CW - 16) / 5;
  const cH = 50;
  cards.forEach((c, i) => {
    const cx = M + i*(cW+4);
    page.drawRectangle({x:cx, y:y-cH, width:cW, height:cH, color:c.bg, borderRadius:4});
    const vs = String(c.val);
    page.drawText(vs, {x:cx+(cW-fB.widthOfTextAtSize(vs,20))/2, y:y-cH+24, size:20, font:fB, color:C.blanc});
    page.drawText(c.label, {x:cx+(cW-fR.widthOfTextAtSize(c.label,6.5))/2, y:y-cH+8, size:6.5, font:fR, color:C.blanc});
  });
  y -= cH + 16;

  // Resume executif
  secTitle('Resume executif');
  (analysis.resume_executif||[]).forEach(t => { drawTxt(t, {bullet:true}); y -= 2; });

  // Faits marquants
  if ((analysis.faits_marquants||[]).length) {
    secTitle('Faits marquants');
    (analysis.faits_marquants||[]).forEach(t => { drawTxt(t, {bullet:true}); y -= 2; });
  }

  // Blocs politiques — TABLEAU lisible
  secTitle('Resultats par bloc politique');

  // En-tête tableau
  const colBloc = 160, colEng = 50, colElu = 55, colQual = 60, colDef = 55;
  const rowH = 16;
  const headers = ['Bloc politique','Engages','Elus','Qualifies','Defaites'];
  const colXs = [M, M+colBloc, M+colBloc+colEng, M+colBloc+colEng+colElu, M+colBloc+colEng+colElu+colQual];

  ensureY(20);
  page.drawRectangle({x:M, y:y-rowH+4, width:CW, height:rowH, color:C.fond});
  headers.forEach((h,i) => {
    page.drawText(h, {x:colXs[i]+4, y:y-rowH+8, size:7.5, font:fB, color:C.roseDark});
  });
  y -= rowH + 2;

  (analysis.analyse_blocs||[]).filter(b=>b.engages>0).forEach((b, idx) => {
    ensureY(rowH);
    if (idx%2===0) page.drawRectangle({x:M, y:y-rowH+4, width:CW, height:rowH, color:rgb(0.97,0.97,0.97)});

    const vals = [b.bloc, String(b.engages), String(b.elus), String(b.qualifies), String(b.defaites)];
    const colors = [C.noir, C.gris, b.elus>0?C.vert:C.gris, b.qualifies>0?C.orange:C.gris, b.defaites>0?C.rouge:C.gris];
    vals.forEach((v,i) => {
      page.drawText(v, {x:colXs[i]+4, y:y-rowH+8, size:i===0?8:8.5, font:i===0?fR:fB, color:colors[i]});
    });
    y -= rowH;
  });
  y -= 8;

  // Points d'attention
  if ((analysis.points_attention||[]).length) {
    secTitle("Points d'attention");
    (analysis.points_attention||[]).forEach(t => { drawTxt(t, {bullet:true, color:C.gris}); y -= 2; });
  }

  // ── PAGE 2 — Depts en liste simple (1 colonne, pas 2) ──────────────────
  newPage();
  page.drawText('RESULTATS PAR DEPARTEMENT - CONSEILLERS REGIONAUX', {x:M, y, size:12, font:fB, color:C.noir});
  y -= 20;

  const deptData = analysis.elus_par_dept||[];

  for (const d of deptData) {
    const lineCount = 2 + (d.elus.length>0?1+d.elus.length:0) + (d.qualifies.length>0?1+d.qualifies.length:0);
    const needed = lineCount * 12 + 20;
    ensureY(needed);

    // Bandeau dept
    page.drawRectangle({x:M, y:y-14, width:CW, height:18, color:C.fond, borderRadius:3});
    page.drawText(d.dept, {x:M+8, y:y-10, size:9, font:fB, color:C.roseDark});
    page.drawText(d.stats, {x:M+8, y:y-22, size:7.5, font:fR, color:C.grisClair});
    y -= 30;

    if (d.elus.length > 0) {
      page.drawText('Elus :', {x:M+10, y, size:8, font:fB, color:C.vert});
      y -= 12;
      for (const nom of d.elus) {
        ensureY(12);
        page.drawText('v', {x:M+12, y, size:7.5, font:fB, color:C.vert});
        const lines = wrapText(nom, fR, 8.5, CW-30);
        lines.forEach((line,i) => {
          if (i>0) { ensureY(12); y-=0; }
          page.drawText(line, {x:M+22, y, size:8.5, font:fR, color:C.noir});
          if (i<lines.length-1) y -= 12;
        });
        y -= 13;
      }
    }

    if (d.qualifies.length > 0) {
      ensureY(12);
      page.drawText('Qualifies 2T :', {x:M+10, y, size:8, font:fB, color:C.orange});
      y -= 12;
      for (const nom of d.qualifies) {
        ensureY(12);
        page.drawText('>', {x:M+12, y, size:7.5, font:fB, color:C.orange});
        const lines = wrapText(nom, fR, 8.5, CW-30);
        lines.forEach((line,i) => {
          if (i>0) { ensureY(12); }
          page.drawText(line, {x:M+22, y, size:8.5, font:fR, color:C.noir});
          if (i<lines.length-1) y -= 12;
        });
        y -= 13;
      }
    }

    y -= 6;
    page.drawLine({start:{x:M, y}, end:{x:M+CW, y}, thickness:0.3, color:C.regle});
    y -= 8;
  }

  // Pied de page
  const pages = pdfDoc.getPages();
  const genStr = `Genere le ${new Date(meta.generatedAt||Date.now()).toLocaleString('fr-FR')} - Application Municipales 2026 NA`;
  pages.forEach((pg, i) => {
    pg.drawLine({start:{x:M,y:28}, end:{x:W-M,y:28}, thickness:0.5, color:C.regle});
    pg.drawText(genStr, {x:M, y:16, size:7, font:fR, color:C.grisClair});
    const ps = `Page ${i+1} / ${pages.length}`;
    pg.drawText(ps, {x:W-M-fR.widthOfTextAtSize(ps,7), y:16, size:7, font:fR, color:C.grisClair});
  });

  return pdfDoc.save();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Method not allowed'}); }
  try {
    const data = typeof req.body==='string' ? JSON.parse(req.body) : req.body;
    if (!data?.stats) return res.status(400).json({error:'Payload incomplet'});
    let analysis;
    try { analysis = await callAnthropic(data); } catch { analysis = buildFallbackAnalysis(data); }
    const pdfBytes = await buildPdf(analysis, {lastUpd:data.lastUpd, generatedAt:data.generatedAt, stats:data.stats});
    const date = new Date().toLocaleDateString('fr-FR').replace(/\//g,'-');
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`attachment; filename="Municipales2026_NA_Analyse_${date}.pdf"`);
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    return res.status(500).json({error: error.message||'Erreur serveur'});
  }
}
