import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function pickText(content) {
  if (!Array.isArray(content)) return '';
  return content
    .filter(block => block && block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('\n');
}

function buildFallbackAnalysis(data) {
  const communes = Array.isArray(data.communes) ? data.communes : [];
  const blocs = Array.isArray(data.blocs) ? data.blocs : [];
  const depts = Array.isArray(data.depts) ? data.depts : [];
  const stats = data.stats || {};

  const blocsSorted = [...blocs].sort((a, b) => (
    (b.victoires_1t + b.victoires_2t) - (a.victoires_1t + a.victoires_2t)
  ));
  const deptsSorted = [...depts].sort((a, b) => (
    (b.victoires_1t + b.victoires_2t + b.qualifies_2t) - (a.victoires_1t + a.victoires_2t + a.qualifies_2t)
  ));

  return {
    titre: 'Note d’analyse des résultats municipaux',
    sous_titre: 'Nouvelle-Aquitaine · synthèse automatique',
    resume_executif: [
      `${stats.total || 0} conseillers régionaux suivis, ${stats.cands || 0} encore en course, ${stats.e1 || 0} victoires au 1er tour et ${stats.e2 || 0} victoires au 2nd tour.`,
      `${communes.length} communes comportent déjà au moins une saisie de résultat.`,
      `La photographie reste évolutive et dépend directement des résultats saisis dans l’application.`
    ],
    faits_marquants: blocsSorted.slice(0, 4).map(b => `${b.bloc}: ${b.engages} engagés, ${b.victoires_1t + b.victoires_2t} victoires, ${b.qualifies_2t} qualifiés.`),
    analyse_par_bloc: blocs.map(b => ({
      bloc: b.bloc,
      analyse: `${b.engages} CR engagés. ${b.victoires_1t} victoire(s) au 1er tour, ${b.victoires_2t} au 2nd tour, ${b.qualifies_2t} qualifié(s) et ${b.defaites_1t + b.defaites_2t} défaite(s).`
    })),
    analyse_par_departement: deptsSorted.slice(0, 12).map(d => ({
      departement: `${d.dept} ${d.departement}`,
      analyse: `${d.communes_avec_resultats}/${d.communes_suivies} communes suivies ont déjà des résultats. ${d.victoires_1t + d.victoires_2t} victoire(s), ${d.qualifies_2t} qualification(s), ${d.defaites} défaite(s).`
    })),
    points_attention: [
      'Vérifier les communes à fort enjeu encore sans résultat saisi.',
      'Contrôler les reports automatiques vers les fiches des conseillers régionaux lorsque plusieurs listes de même bloc coexistent.',
      'Actualiser la note après chaque nouvelle saisie significative pour éviter une lecture figée.'
    ]
  };
}

async function callAnthropic(data) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante');

  const prompt = {
    context: {
      generatedAt: data.generatedAt,
      lastUpd: data.lastUpd,
      stats: data.stats,
      blocs: data.blocs,
      depts: data.depts,
      communes: data.communes,
      crs: data.crs,
    },
    task: 'Rédige une note d’analyse politique concise et structurée à partir de ces résultats municipaux. Ne pas inventer. S’appuyer uniquement sur les données fournies.',
    required_output_schema: {
      titre: 'string',
      sous_titre: 'string',
      resume_executif: ['string'],
      faits_marquants: ['string'],
      analyse_par_bloc: [{ bloc: 'string', analyse: 'string' }],
      analyse_par_departement: [{ departement: 'string', analyse: 'string' }],
      points_attention: ['string']
    },
    constraints: [
      'Répondre en JSON strict uniquement, sans balises Markdown.',
      'Maximum 3 phrases par item.',
      'Tonalité institutionnelle, sobre, analytique.',
      'Ne jamais citer de source externe.',
      'Ne jamais créer de résultat absent des données.'
    ]
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1800,
      temperature: 0.2,
      system: 'Tu es un rédacteur institutionnel. Tu analyses des résultats électoraux sans extrapolation et tu renvoies uniquement un JSON valide.',
      messages: [
        {
          role: 'user',
          content: JSON.stringify(prompt)
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic ${response.status}: ${text}`);
  }

  const json = await response.json();
  const text = pickText(json.content);
  const parsed = safeJsonParse(text);
  if (!parsed) throw new Error('Réponse Claude non parseable en JSON');
  return parsed;
}

function wrapText(text, font, size, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

async function buildPdf(analysis, meta = {}) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 50;
  const width = page.getWidth() - margin * 2;
  const height = page.getHeight();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const colors = {
    title: rgb(0.12, 0.12, 0.12),
    accent: rgb(0.55, 0.12, 0.25),
    text: rgb(0.15, 0.15, 0.15),
    muted: rgb(0.45, 0.45, 0.45),
    rule: rgb(0.86, 0.86, 0.86),
  };

  let y = height - margin;

  const ensureSpace = (needed = 24) => {
    if (y - needed < margin) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = page.getHeight() - margin;
    }
  };

  const drawRule = () => {
    ensureSpace(16);
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + width, y },
      thickness: 1,
      color: colors.rule,
    });
    y -= 16;
  };

  const drawTextBlock = (text, opts = {}) => {
    const {
      font = fontRegular,
      size = 11,
      color = colors.text,
      leading = 15,
      bullet = false,
    } = opts;

    const bulletOffset = bullet ? 12 : 0;
    const lines = wrapText(text, font, size, width - bulletOffset);
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(leading);
      const line = lines[i];
      if (bullet && i === 0) {
        page.drawText('•', { x: margin, y, size, font, color });
      }
      page.drawText(line, {
        x: margin + bulletOffset,
        y,
        size,
        font,
        color,
      });
      y -= leading;
    }
  };

  const drawSectionTitle = (text) => {
    ensureSpace(28);
    page.drawText(text, {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: colors.accent,
    });
    y -= 18;
  };

  page.drawText(analysis.titre || 'Note d’analyse', {
    x: margin,
    y,
    size: 22,
    font: fontBold,
    color: colors.title,
  });
  y -= 28;

  page.drawText(analysis.sous_titre || 'Synthèse automatique', {
    x: margin,
    y,
    size: 11,
    font: fontRegular,
    color: colors.muted,
  });
  y -= 16;

  page.drawText(`Mise à jour: ${meta.lastUpd || ''}`, {
    x: margin,
    y,
    size: 10,
    font: fontRegular,
    color: colors.muted,
  });
  y -= 12;

  if (meta.generatedAt) {
    page.drawText(`Généré le: ${new Date(meta.generatedAt).toLocaleString('fr-FR')}`, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: colors.muted,
    });
    y -= 12;
  }

  drawRule();

  if (Array.isArray(analysis.resume_executif) && analysis.resume_executif.length) {
    drawSectionTitle('Résumé exécutif');
    analysis.resume_executif.forEach(item => drawTextBlock(item, { bullet: true }));
    y -= 4;
  }

  if (Array.isArray(analysis.faits_marquants) && analysis.faits_marquants.length) {
    drawSectionTitle('Faits marquants');
    analysis.faits_marquants.forEach(item => drawTextBlock(item, { bullet: true }));
    y -= 4;
  }

  if (Array.isArray(analysis.analyse_par_bloc) && analysis.analyse_par_bloc.length) {
    drawSectionTitle('Analyse par bloc');
    analysis.analyse_par_bloc.forEach(item => {
      drawTextBlock(item.bloc || '', { font: fontBold, size: 11, color: colors.title, leading: 14 });
      drawTextBlock(item.analyse || '', { size: 11 });
      y -= 4;
    });
  }

  if (Array.isArray(analysis.analyse_par_departement) && analysis.analyse_par_departement.length) {
    drawSectionTitle('Analyse par département');
    analysis.analyse_par_departement.forEach(item => {
      drawTextBlock(item.departement || '', { font: fontBold, size: 11, color: colors.title, leading: 14 });
      drawTextBlock(item.analyse || '', { size: 11 });
      y -= 4;
    });
  }

  if (Array.isArray(analysis.points_attention) && analysis.points_attention.length) {
    drawSectionTitle('Points d’attention');
    analysis.points_attention.forEach(item => drawTextBlock(item, { bullet: true }));
  }

  return pdfDoc.save();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!data || !data.stats) {
      return res.status(400).json({ error: 'Payload incomplet' });
    }

    let analysis;
    try {
      analysis = await callAnthropic(data);
    } catch (error) {
      analysis = buildFallbackAnalysis(data);
    }

    const pdfBytes = await buildPdf(analysis, {
      lastUpd: data.lastUpd,
      generatedAt: data.generatedAt,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Municipales2026_Note_Analyse.pdf"');
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}
