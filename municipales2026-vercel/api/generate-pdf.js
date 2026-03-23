import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

// ── Couleurs charte Groupe Socialiste ──────────────────────────────────────
const C = {
  rose:    rgb(0.91, 0.09, 0.43),   // #E8186D
  roseDark:rgb(0.75, 0.06, 0.34),   // #C00F57
  noir:    rgb(0.10, 0.10, 0.10),
  gris:    rgb(0.35, 0.35, 0.35),
  grisClair:rgb(0.60, 0.60, 0.60),
  blanc:   rgb(1,   1,   1),
  fond:    rgb(0.97, 0.95, 0.96),   // fond rose très clair
  vert:    rgb(0.10, 0.55, 0.25),
  orange:  rgb(0.85, 0.40, 0.05),
  rouge:   rgb(0.75, 0.10, 0.10),
  bleu:    rgb(0.08, 0.32, 0.65),
  regle:   rgb(0.88, 0.88, 0.88),
};

function safeJsonParse(v) { try { return JSON.parse(v); } catch { return null; } }

function pickText(content) {
  if (!Array.isArray(content)) return '';
  return content.filter(b => b?.type === 'text').map(b => b.text).join('\n');
}

// ── Construction du fallback (sans Claude) ─────────────────────────────────
function buildFallbackAnalysis(data) {
  const { stats = {}, blocs = [], depts = [], crs = [], communes = [] } = data;

  // CR élus par dept
  const elus = (crs || []).filter(c =>
    c.statut === 'Victoire 1er Tour' || c.statut === 'Victoire 2nd Tour'
  );
  const qualifies = (crs || []).filter(c => c.statut === 'Qualifié·e pour le 2nd Tour');

  const elusByDept = {};
  elus.forEach(c => {
    if (!elusByDept[c.dept]) elusByDept[c.dept] = [];
    elusByDept[c.dept].push(c.nom + (c.commune ? ` (${c.commune})` : ''));
  });

  const qualByDept = {};
  qualifies.forEach(c => {
    if (!qualByDept[c.dept]) qualByDept[c.dept] = [];
    qualByDept[c.dept].push(c.nom + (c.commune ? ` (${c.commune})` : ''));
  });

  const totalElus = (stats.e1 || 0) + (stats.e2 || 0);
  const totalQual = stats.ball || 0;
  const totalDef = stats.def || 0;

  const blocsPSPP = blocs.find(b => b.bloc?.includes('PS') || b.bloc?.includes('PP'));
  const blocsGauche = blocs.filter(b =>
    b.bloc?.includes('PS') || b.bloc?.includes('DVG') || b.bloc?.includes('LFI') || b.bloc?.includes('Éco')
  );
  const totalGaucheElus = blocsGauche.reduce((s, b) => s + (b.victoires_1t || 0) + (b.victoires_2t || 0), 0);

  const deptsSorted = [...depts].sort((a, b) =>
    ((b.victoires_1t || 0) + (b.victoires_2t || 0) + (b.qualifies_2t || 0)) -
    ((a.victoires_1t || 0) + (a.victoires_2t || 0) + (a.qualifies_2t || 0))
  );

  return {
    titre: 'Note d\'analyse - Résultats municipaux 2026',
    sous_titre: 'Groupe Socialiste, Place Publique & Apparentés - Conseil Régional Nouvelle-Aquitaine',
    resume_executif: [
      `Sur ${stats.total || 0} conseillers régionaux suivis, ${totalElus} ont remporté leur élection (${stats.e1 || 0} dès le 1er tour), ${totalQual} sont qualifiés pour le 2nd tour et ${totalDef} ont été battus.`,
      `Le groupe PS/PP et apparentés confirme son ancrage territorial en Nouvelle-Aquitaine avec ${blocsPSPP ? (blocsPSPP.victoires_1t || 0) + (blocsPSPP.victoires_2t || 0) : totalElus} victoires directes et ${blocsPSPP ? (blocsPSPP.qualifies_2t || 0) : totalQual} qualifications pour le second tour.`,
      `${communes.length || 0} communes clés ont déjà des résultats enregistrés dans l\'application de suivi.`,
    ],
    elus_par_dept: deptsSorted.slice(0, 12).map(d => ({
      dept: `${d.dept} - ${d.departement}`,
      elus: elusByDept[d.dept] || [],
      qualifies: qualByDept[d.dept] || [],
      stats: `${(d.victoires_1t || 0) + (d.victoires_2t || 0)} elus - ${d.qualifies_2t || 0} qualifies - ${d.defaites || 0} défaites`,
    })),
    analyse_blocs: blocs.filter(b => (b.engages || 0) > 0).map(b => ({
      bloc: b.bloc,
      engages: b.engages || 0,
      elus: (b.victoires_1t || 0) + (b.victoires_2t || 0),
      qualifies: b.qualifies_2t || 0,
      defaites: (b.defaites_1t || 0) + (b.defaites_2t || 0),
    })),
    points_attention: [
      totalQual > 0 ? `${totalQual} conseillers sont encore en lice pour le 2nd tour - mobilisation nécessaire dans les circonscriptions concernées.` : null,
      'Vérifier les communes à fort enjeu encore sans résultat saisi dans l\'application.',
      'Actualiser la note après le 2nd tour pour une synthèse définitive.',
    ].filter(Boolean),
  };
}

// ── Appel Claude pour analyse enrichie ────────────────────────────────────
async function callAnthropic(data) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante');

  const elus = (data.crs || []).filter(c =>
    c.statut === 'Victoire 1er Tour' || c.statut === 'Victoire 2nd Tour'
  ).map(c => ({ nom: c.nom, commune: c.commune, dept: c.dept, groupe: c.groupe, score: c.s1 }));

  const qualifies = (data.crs || []).filter(c =>
    c.statut === 'Qualifié·e pour le 2nd Tour'
  ).map(c => ({ nom: c.nom, commune: c.commune, dept: c.dept, groupe: c.groupe, score: c.s1 }));

  const prompt = `Tu es rédacteur institutionnel pour le Groupe Socialiste, Place Publique & Apparentés du Conseil Régional de Nouvelle-Aquitaine.

Rédige une note d'analyse politique CONCISE et STRUCTURÉE des résultats municipaux 2026 en Nouvelle-Aquitaine.

DONNÉES :
- Stats globales : ${JSON.stringify(data.stats)}
- Blocs politiques : ${JSON.stringify(data.blocs)}
- Départements : ${JSON.stringify(data.depts)}
- CR élus (${elus.length}) : ${JSON.stringify(elus.slice(0, 30))}
- CR qualifiés 2T (${qualifies.length}) : ${JSON.stringify(qualifies.slice(0, 20))}

CONSIGNES :
- Tonalité institutionnelle, sobre, analytique, valorisant le bilan du groupe
- Citer les noms des élus les plus emblématiques (maires confirmés, CR de poids)
- Mettre en valeur les victoires nettes au 1er tour
- Identifier les enjeux du 2nd tour
- Maximum 2 phrases par section département
- Ne jamais inventer de résultat absent des données

FORMAT JSON STRICT (sans balises markdown) :
{
  "titre": "string",
  "sous_titre": "string", 
  "resume_executif": ["string x3"],
  "faits_marquants": ["string x4 - faits politiques saillants avec noms"],
  "elus_par_dept": [{"dept": "XX - Nom", "elus": ["Nom (Commune)"], "qualifies": ["Nom (Commune)"], "stats": "string"}],
  "analyse_blocs": [{"bloc": "string", "engages": 0, "elus": 0, "qualifies": 0, "defaites": 0}],
  "points_attention": ["string x3"]
}`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2500,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic ${response.status}`);
  const json = await response.json();
  const text = pickText(json.content);
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = safeJsonParse(clean);
  if (!parsed) throw new Error('Réponse non parseable');
  return parsed;
}

// ── Utilitaires PDF ────────────────────────────────────────────────────────
function wrapText(text, font, size, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

// ── Construction du PDF ────────────────────────────────────────────────────
async function buildPdf(analysis, meta = {}) {
  const pdfDoc = await PDFDocument.create();
  const W = 595.28, H = 841.89;
  const margin = 44;
  const contentW = W - margin * 2;

  const fReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fItal = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // ── État courant ──────────────────────────────────────────────────────────
  let page = pdfDoc.addPage([W, H]);
  let y = H - margin;

  const newPage = () => {
    page = pdfDoc.addPage([W, H]);
    y = H - margin;
    drawHeader();
  };

  const ensureY = (needed) => { if (y - needed < margin + 20) newPage(); };

  // ── En-tête rose avec logo ────────────────────────────────────────────────
  const drawHeader = () => {
    // Bandeau rose
    page.drawRectangle({ x: 0, y: H - 52, width: W, height: 52, color: C.rose });
    // Titre blanc
    page.drawText('MUNICIPALES 2026', {
      x: margin, y: H - 22, size: 13, font: fBold, color: C.blanc,
    });
    page.drawText('Groupe Socialiste, Place Publique & Apparentés - Nouvelle-Aquitaine', {
      x: margin, y: H - 38, size: 8, font: fReg, color: rgb(1, 0.85, 0.92),
    });
    // Date à droite
    const dateStr = `Mis à jour : ${meta.lastUpd || ''}`;
    const dw = fReg.widthOfTextAtSize(dateStr, 8);
    page.drawText(dateStr, {
      x: W - margin - dw, y: H - 38, size: 8, font: fReg, color: rgb(1, 0.85, 0.92),
    });
    // Trait sous bandeau
    page.drawRectangle({ x: 0, y: H - 54, width: W, height: 2, color: C.roseDark });
    y = H - 54 - 14;
  };

  // ── Titre de section ──────────────────────────────────────────────────────
  const sectionTitle = (text) => {
    ensureY(28);
    y -= 6;
    page.drawRectangle({ x: margin, y: y - 2, width: 3, height: 16, color: C.rose });
    page.drawText(text.toUpperCase(), {
      x: margin + 10, y, size: 9, font: fBold, color: C.rose,
    });
    y -= 18;
    page.drawLine({
      start: { x: margin, y }, end: { x: margin + contentW, y },
      thickness: 0.5, color: C.regle,
    });
    y -= 8;
  };

  // ── Texte avec retour à la ligne ──────────────────────────────────────────
  const drawText = (text, opts = {}) => {
    const { font = fReg, size = 9.5, color = C.noir, leading = 13.5,
            bullet = false, indent = 0 } = opts;
    const bOff = bullet ? 10 : 0;
    const lines = wrapText(text, font, size, contentW - indent - bOff);
    lines.forEach((line, i) => {
      ensureY(leading);
      if (bullet && i === 0) page.drawText('-', { x: margin + indent, y, size, font, color: C.rose });
      page.drawText(line, { x: margin + indent + bOff, y, size, font, color });
      y -= leading;
    });
  };

  // ── Carte stat colorée ────────────────────────────────────────────────────
  const drawStatCard = (x, yCard, w, h, label, value, bgColor, textColor = C.blanc) => {
    page.drawRectangle({ x, y: yCard, width: w, height: h, color: bgColor, borderRadius: 4 });
    const vStr = String(value);
    const vW = fBold.widthOfTextAtSize(vStr, 22);
    page.drawText(vStr, { x: x + (w - vW) / 2, y: yCard + h - 28, size: 22, font: fBold, color: textColor });
    const lW = fReg.widthOfTextAtSize(label, 7.5);
    page.drawText(label, { x: x + (w - lW) / 2, y: yCard + 8, size: 7.5, font: fReg, color: textColor });
  };

  // ── Barre horizontale ─────────────────────────────────────────────────────
  const drawBar = (label, value, max, barColor) => {
    ensureY(20);
    const labelW = 120;
    const barMaxW = contentW - labelW - 50;
    const barW = max > 0 ? Math.round((value / max) * barMaxW) : 0;
    const valStr = String(value);

    page.drawText(label, { x: margin, y, size: 8.5, font: fReg, color: C.gris });
    if (barW > 0) {
      page.drawRectangle({ x: margin + labelW, y: y - 1, width: barW, height: 9, color: barColor, borderRadius: 2 });
    }
    page.drawRectangle({ x: margin + labelW, y: y - 1, width: barMaxW, height: 9,
      color: rgb(0,0,0), opacity: 0, borderColor: C.regle, borderWidth: 0.5, borderRadius: 2 });
    page.drawText(valStr, { x: margin + labelW + barMaxW + 6, y, size: 8.5, font: fBold, color: C.noir });
    y -= 16;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1
  // ═══════════════════════════════════════════════════════════════════════════
  drawHeader();

  // Titre principal
  ensureY(50);
  y -= 4;
  page.drawText(analysis.titre || 'Note d\'analyse - Résultats municipaux 2026', {
    x: margin, y, size: 16, font: fBold, color: C.noir,
  });
  y -= 20;
  page.drawText(analysis.sous_titre || '', { x: margin, y, size: 9, font: fItal, color: C.gris });
  y -= 20;

  // ── Bloc stats ────────────────────────────────────────────────────────────
  const stats = meta.stats || {};
  const cardW = (contentW - 15) / 4;
  const cardH = 52;
  const cardY = y - cardH;
  drawStatCard(margin,              cardY, cardW, cardH, 'VICTOIRES 1T',  stats.e1   || 0, C.vert);
  drawStatCard(margin + cardW + 5,  cardY, cardW, cardH, 'QUALIFIÉS 2T',  stats.ball || 0, C.orange);
  drawStatCard(margin + (cardW+5)*2,cardY, cardW, cardH, 'DÉFAITES',      stats.def  || 0, C.rouge);
  drawStatCard(margin + (cardW+5)*3,cardY, cardW, cardH, 'CR SUIVIS',     stats.total|| 0, C.bleu);
  y = cardY - 18;

  // ── Résumé exécutif ───────────────────────────────────────────────────────
  sectionTitle('Résumé exécutif');
  (analysis.resume_executif || []).forEach(item => {
    drawText(item, { bullet: true, size: 9.5 });
    y -= 2;
  });

  // ── Faits marquants ───────────────────────────────────────────────────────
  if (Array.isArray(analysis.faits_marquants) && analysis.faits_marquants.length) {
    sectionTitle('Faits marquants');
    analysis.faits_marquants.forEach(item => {
      drawText(item, { bullet: true, size: 9.5 });
      y -= 2;
    });
  }

  // ── Analyse par bloc ──────────────────────────────────────────────────────
  sectionTitle('Résultats par bloc politique');
  const blocs = analysis.analyse_blocs || [];
  const maxElus = Math.max(...blocs.map(b => b.elus || 0), 1);

  blocs.filter(b => b.engages > 0).forEach(b => {
    ensureY(38);
    // Ligne bloc
    page.drawText(b.bloc, { x: margin, y, size: 9, font: fBold, color: C.noir });
    const engStr = `${b.engages} engages`;
    const engW = fReg.widthOfTextAtSize(engStr, 8);
    page.drawText(engStr, { x: margin + contentW - engW, y, size: 8, font: fReg, color: C.grisClair });
    y -= 13;
    // Mini barres
    const bW = (contentW - 12) / 3;
    const bH = 8;
    // Victoires
    const vRatio = b.engages > 0 ? (b.elus / b.engages) : 0;
    page.drawRectangle({ x: margin, y: y - bH, width: bW, height: bH, color: rgb(0.88,0.94,0.89), borderRadius: 2 });
    if (vRatio > 0) page.drawRectangle({ x: margin, y: y - bH, width: Math.round(bW * vRatio), height: bH, color: C.vert, borderRadius: 2 });
    page.drawText(`+ ${b.elus} élus`, { x: margin + 4, y: y - bH + 2, size: 7, font: fBold, color: C.blanc });
    // Qualifiés
    const qRatio = b.engages > 0 ? (b.qualifies / b.engages) : 0;
    page.drawRectangle({ x: margin + bW + 6, y: y - bH, width: bW, height: bH, color: rgb(0.95,0.90,0.83), borderRadius: 2 });
    if (qRatio > 0) page.drawRectangle({ x: margin + bW + 6, y: y - bH, width: Math.round(bW * qRatio), height: bH, color: C.orange, borderRadius: 2 });
    page.drawText(`~ ${b.qualifies} qual.`, { x: margin + bW + 10, y: y - bH + 2, size: 7, font: fBold, color: C.blanc });
    // Défaites
    const dRatio = b.engages > 0 ? (b.defaites / b.engages) : 0;
    page.drawRectangle({ x: margin + (bW + 6) * 2, y: y - bH, width: bW, height: bH, color: rgb(0.95,0.88,0.88), borderRadius: 2 });
    if (dRatio > 0) page.drawRectangle({ x: margin + (bW + 6) * 2, y: y - bH, width: Math.round(bW * dRatio), height: bH, color: C.rouge, borderRadius: 2 });
    page.drawText(`- ${b.defaites} déf.`, { x: margin + (bW + 6) * 2 + 4, y: y - bH + 2, size: 7, font: fBold, color: C.blanc });

    y -= bH + 10;
  });

  // ── Points d'attention ────────────────────────────────────────────────────
  if (Array.isArray(analysis.points_attention) && analysis.points_attention.length) {
    ensureY(60);
    sectionTitle('Points d\'attention');
    analysis.points_attention.forEach(item => {
      drawText(item, { bullet: true, size: 9.5, color: C.gris });
      y -= 2;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2 - CR par département
  // ═══════════════════════════════════════════════════════════════════════════
  newPage();
  y -= 4;
  page.drawText('RÉSULTATS PAR DÉPARTEMENT - CONSEILLERS RÉGIONAUX', {
    x: margin, y, size: 13, font: fBold, color: C.noir,
  });
  y -= 22;

  const deptData = analysis.elus_par_dept || [];
  // 2 colonnes
  const col1X = margin;
  const col2X = margin + contentW / 2 + 6;
  const colW = contentW / 2 - 6;

  let col = 0;
  let colY = y;
  let col2StartY = y;

  deptData.forEach((d, idx) => {
    const isCol2 = col === 1;
    const baseX = isCol2 ? col2X : col1X;
    let localY = isCol2 ? col2StartY : colY;

    // En-tête département
    const needH = 28 + (d.elus.length + d.qualifies.length) * 14 + 16;
    if (!isCol2 && localY - needH < margin + 30) {
      // Passer en colonne 2
      col = 1;
      col2StartY = y;
      localY = col2StartY;
    }

    // Bandeau dept
    page.drawRectangle({ x: baseX, y: localY - 14, width: colW, height: 18, color: C.fond, borderRadius: 3 });
    page.drawText(d.dept, { x: baseX + 6, y: localY - 10, size: 8.5, font: fBold, color: C.roseDark });
    page.drawText(d.stats, {
      x: baseX + 6, y: localY - 22, size: 7, font: fReg, color: C.grisClair,
    });
    localY -= 30;

    // Élus
    if (d.elus.length > 0) {
      page.drawText('Elus :', { x: baseX + 6, y: localY, size: 7.5, font: fBold, color: C.vert });
      localY -= 12;
      d.elus.forEach(nom => {
        const lines = wrapText(nom, fReg, 8, colW - 18);
        lines.forEach(line => {
          page.drawText('v', { x: baseX + 8, y: localY, size: 7, font: fBold, color: C.vert });
          page.drawText(line, { x: baseX + 18, y: localY, size: 8, font: fReg, color: C.noir });
          localY -= 12;
        });
      });
    }

    // Qualifiés
    if (d.qualifies.length > 0) {
      page.drawText('Qualifies 2T :', { x: baseX + 6, y: localY, size: 7.5, font: fBold, color: C.orange });
      localY -= 12;
      d.qualifies.forEach(nom => {
        const lines = wrapText(nom, fReg, 8, colW - 18);
        lines.forEach(line => {
          page.drawText('>', { x: baseX + 8, y: localY, size: 7, font: fBold, color: C.orange });
          page.drawText(line, { x: baseX + 18, y: localY, size: 8, font: fReg, color: C.noir });
          localY -= 12;
        });
      });
    }

    localY -= 8;

    if (col === 0) colY = localY;
    else col2StartY = localY;

    // Alterner colonnes
    if (col === 0 && idx < deptData.length - 1) col = 1;
    else col = 0;
  });

  // ── Pied de page sur toutes les pages ─────────────────────────────────────
  const pages = pdfDoc.getPages();
  const genStr = `Généré le ${new Date(meta.generatedAt || Date.now()).toLocaleString('fr-FR')} - Application Municipales 2026 NA`;
  pages.forEach((pg, i) => {
    const pgW = pg.getWidth();
    pg.drawLine({
      start: { x: margin, y: 28 }, end: { x: pgW - margin, y: 28 },
      thickness: 0.5, color: C.regle,
    });
    pg.drawText(genStr, { x: margin, y: 16, size: 7, font: fReg, color: C.grisClair });
    const pgStr = `Page ${i + 1} / ${pages.length}`;
    const pgW2 = fReg.widthOfTextAtSize(pgStr, 7);
    pg.drawText(pgStr, { x: pgW - margin - pgW2, y: 16, size: 7, font: fReg, color: C.grisClair });
  });

  return pdfDoc.save();
}

// ── Handler Vercel ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!data?.stats) return res.status(400).json({ error: 'Payload incomplet' });

    let analysis;
    try {
      analysis = await callAnthropic(data);
    } catch {
      analysis = buildFallbackAnalysis(data);
    }

    const pdfBytes = await buildPdf(analysis, {
      lastUpd: data.lastUpd,
      generatedAt: data.generatedAt,
      stats: data.stats,
    });

    const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Municipales2026_NA_Analyse_${date}.pdf"`);
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}
