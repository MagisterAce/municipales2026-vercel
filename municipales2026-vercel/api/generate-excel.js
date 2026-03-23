import ExcelJS from 'exceljs';
import sharp from 'sharp';

// ── Couleurs ──────────────────────────────────────────────────────────────
const C_HDR_BG  = 'FF1A1A2E';
const C_HDR_FG  = 'FFFFFFFF';
const C_DEPT_BG = 'FF2C3E50';
const C_DEPT_FG = 'FFFFFFFF';
const C_ODD     = 'FFF8F9FA';
const C_EVEN    = 'FFFFFFFF';
const C_GREY_FG = 'FF888888';
const C_SEP_BG  = 'FFF0F0F0';
const C_PINK    = 'FFE8186D';

const NUANCE_COLORS = {
  PS:'FFC0392B', UG:'FF922B21', DVG:'FFFE7043', PCF:'FF7B241C',
  PRG:'FFA93226', LFI:'FF6C3483', 'Écolo':'FF1E8449', EELV:'FF1E8449',
  RN:'FF003189', LR:'FF2874A6', DVD:'FF5D6D7E', DVC:'FF1976D2',
  RE:'FF0D47A1', UDI:'FF0288D1', REC:'FF0D0066', EXG:'FF4A235A',
  NC:'FFAAB7B8', DIV:'FF9E9E9E', 'MoDem':'FFF57F17',
};
const NUANCE_FG = {
  PS:'FFFFFFFF', UG:'FFFFFFFF', DVG:'FFFFFFFF', PCF:'FFFFFFFF',
  PRG:'FFFFFFFF', LFI:'FFFFFFFF', 'Écolo':'FFFFFFFF', EELV:'FFFFFFFF',
  RN:'FFFFFFFF', LR:'FFFFFFFF', DVD:'FFFFFFFF', DVC:'FFFFFFFF',
  RE:'FFFFFFFF', UDI:'FFFFFFFF', REC:'FFFFFFFF', EXG:'FFFFFFFF',
  NC:'FF000000', DIV:'FF000000', 'MoDem':'FF000000',
};
const STATUT_COLORS = {
  'Victoire 1er Tour':      { bg:'FF1E8449', fg:'FFFFFFFF' },
  'Victoire 2nd Tour':      { bg:'FF145A32', fg:'FFFFFFFF' },
  'Qualifié·e pour le 2nd Tour': { bg:'FFF39C12', fg:'FFFFFFFF' },
  'Défaite 1er Tour':       { bg:'FFC0392B', fg:'FFFFFFFF' },
  'Défaite 2nd Tour':       { bg:'FF7B241C', fg:'FFFFFFFF' },
  'Non-candidat':           { bg:'FFD5D8DC', fg:'FF555555' },
  'Candidat':               { bg:'FF2E86C1', fg:'FFFFFFFF' },
};

const PS_GROUPES = ['PS/PP','PS','PP','PRG','PS/PCF','PCF'];

function cellFill(bg) {
  return { type:'pattern', pattern:'solid', fgColor:{ argb:bg } };
}
function cellFont(fg='FF000000', bold=false, sz=9) {
  return { name:'Arial', size:sz, bold, color:{ argb:fg } };
}
function cellAlign(h='left', v='middle', wrap=false) {
  return { horizontal:h, vertical:v, wrapText:wrap };
}

function applyHdr(ws, labels, widths) {
  ws.addRow(labels);
  const r = ws.lastRow;
  r.height = 30;
  r.eachCell(cell => {
    cell.fill = cellFill(C_HDR_BG);
    cell.font = cellFont(C_HDR_FG, true, 9);
    cell.alignment = cellAlign('center','middle',true);
  });
  widths.forEach((w,i) => { ws.getColumn(i+1).width = w; });
}

function applyDeptRow(ws, label, ncols) {
  ws.addRow([label, ...Array(ncols-1).fill(null)]);
  const r = ws.lastRow;
  r.height = 18;
  ws.mergeCells(r.number, 1, r.number, ncols);
  const c = r.getCell(1);
  c.fill = cellFill(C_DEPT_BG);
  c.font = cellFont(C_DEPT_FG, true, 9);
  c.alignment = cellAlign('left','middle');
}

// ── Ajouter logo + titre (4 lignes logo, 1 ligne séparateur) ─────────────
async function addLogoHeader(ws, wb, logoBuffer, titre, ncols) {
  // 4 lignes réservées pour le logo
  for (let i = 0; i < 4; i++) {
    ws.addRow(Array(ncols).fill(null));
    ws.lastRow.height = 18;
  }

  // Logo image
  if (logoBuffer) {
    const imageId = wb.addImage({ buffer: logoBuffer, extension:'png' });
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 190, height: 63 },
      editAs: 'oneCell',
    });
  }

  // Titre dans F1:last_col fusionné
  ws.mergeCells(1, 6, 4, ncols);
  const tc = ws.getCell(1, 6);
  tc.value = titre;
  tc.font = { name:'Arial', size:14, bold:true, color:{ argb:C_PINK } };
  tc.alignment = cellAlign('left','middle',true);

  // Ligne 5 : séparateur rose fin
  ws.addRow(Array(ncols).fill(' '));
  const sep = ws.lastRow;
  sep.height = 3;
  sep.eachCell({ includeEmpty:true }, cell => {
    cell.fill = cellFill(C_PINK);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({ error:'Method not allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { depts, communes, listes_data, liste_results, cr_list } = data;

    // ── Charger le logo depuis le CDN externe ─────────────────────
    let logoBuffer = null;
    try {
      const logoRes = await fetch('https://socialistes-apparentes.groupes-politiques-nouvelle-aquitaine.fr/wp-content/themes/yootheme/cache/b1/LOGO_ps_horizontal-1-1-b10575a3.webp');
      if (logoRes.ok) {
        const ab = await logoRes.arrayBuffer();
        // Convertir webp → png (ExcelJS n'accepte que png/jpeg)
        logoBuffer = await sharp(Buffer.from(ab)).png().toBuffer();
      }
    } catch(e) {
      console.warn('Logo non chargé:', e.message);
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Groupe Socialiste PP NA';
    wb.created = new Date();
    const date = new Date().toLocaleDateString('fr-FR');

    // ══════════════════════════════════════════════════════════════
    // ONGLET 1 : COMMUNES CLÉS
    // ══════════════════════════════════════════════════════════════
    const ws1 = wb.addWorksheet('Communes Clés');

    const cols1 = ['Dept','Département','Commune','Enjeu','Pop.',
      'Maire sortant','CR liés (groupe)','Liste','Nuance','Tête de liste',
      'Statut 1er Tour','Nb Voix 1T','Score 1T %',
      'Statut 2nd Tour','Nb Voix 2T','Score 2T %'];
    const widths1 = [5,14,16,10,8,22,22,32,8,22,24,10,9,24,10,9];

    await addLogoHeader(ws1, wb, logoBuffer,
      'Élections Municipales 2026\nRésultats — Communes Clés Nouvelle-Aquitaine',
      cols1.length);

    applyHdr(ws1, cols1, widths1);
    ws1.views = [{ state:'frozen', xSplit:0, ySplit:ws1.lastRow.number }];

    for (const dept of (depts||[])) {
      const deptComs = (communes||[])
        .filter(c => c.dept === dept.code)
        .sort((a,b) => {
          const r = { 'très fort':0,'fort':1,'moyen':2,'faible':3 };
          return (r[a.enjeu?.toLowerCase()]??9) - (r[b.enjeu?.toLowerCase()]??9);
        });
      if (!deptComs.length) continue;

      applyDeptRow(ws1, `▶  ${dept.nom} (${dept.code})`, cols1.length);

      let rowCount = 0;
      for (const com of deptComs) {
        const comKey = `${com.dept}|${com.nom}`;
        const listes = listes_data?.[comKey] || [];
        if (!listes.length) continue;

        for (let li = 0; li < listes.length; li++) {
          const liste = listes[li];
          const rkey = `${comKey}|${li}`;
          const res_data = (liste_results||{})[rkey] || {};
          const bg = rowCount % 2 === 0 ? C_ODD : C_EVEN;

          ws1.addRow([
            li === 0 ? com.dept : null,
            li === 0 ? dept.nom : null,
            li === 0 ? com.nom : null,
            li === 0 ? com.enjeu : null,
            li === 0 ? (com.pop || null) : null,
            li === 0 ? (com.maire || null) : null,
            li === 0 ? (com.cr || null) : null,
            liste.nom || null,
            liste.nuance || null,
            liste.tete || null,
            res_data.statut_t1 || null,
            res_data.voix_t1 ?? null,
            res_data.score_t1 ?? null,
            res_data.statut_t2 || null,
            res_data.voix_t2 ?? null,
            res_data.score_t2 ?? null,
          ]);

          const row = ws1.lastRow;
          row.height = 15;
          row.eachCell({ includeEmpty:true }, (cell, ci) => {
            const val = cell.value;
            // Colonne Nuance (9)
            if (ci === 9 && val) {
              const nc = NUANCE_COLORS[String(val)] || 'FF888888';
              const nf = NUANCE_FG[String(val)] || 'FFFFFFFF';
              cell.fill = cellFill(nc);
              cell.font = cellFont(nf, true, 8);
              cell.alignment = cellAlign('center','middle');
            }
            // Colonnes statut (11 et 14)
            else if ((ci === 11 || ci === 14) && val) {
              const sc = STATUT_COLORS[String(val)];
              if (sc) {
                cell.fill = cellFill(sc.bg);
                cell.font = cellFont(sc.fg, true, 8);
                cell.alignment = cellAlign('center','middle');
              } else {
                cell.fill = cellFill(bg);
                cell.font = cellFont('FF000000', false, 9);
              }
            }
            // Commune en gras sur 1ère liste
            else if (ci === 3 && li === 0 && val) {
              cell.fill = cellFill(bg);
              cell.font = cellFont('FF000000', true, 9);
              cell.alignment = cellAlign('left','middle');
            }
            // Scores et voix centrés
            else if ((ci === 12 || ci === 13 || ci === 15 || ci === 16) && val !== null) {
              cell.fill = cellFill(bg);
              cell.font = cellFont('FF000000', false, 9);
              cell.alignment = cellAlign('center','middle');
            }
            else {
              cell.fill = cellFill(bg);
              cell.font = cellFont('FF000000', false, 9);
              cell.alignment = cellAlign('left','middle');
            }
          });
          rowCount++;
        }

        // Séparateur entre communes
        ws1.addRow(Array(cols1.length).fill(null));
        ws1.lastRow.height = 3;
        ws1.lastRow.eachCell({ includeEmpty:true }, cell => {
          cell.fill = cellFill(C_SEP_BG);
        });
      }
    }

    // ══════════════════════════════════════════════════════════════
    // ONGLET 2 : CONSEILLERS RÉGIONAUX
    // ══════════════════════════════════════════════════════════════
    const ws2 = wb.addWorksheet('Conseillers Régionaux');

    const cols2 = ['Dept','Département','Nom','Groupe','Commune',
      'Mandat','Perspectives','Statut 1T','Score 1T %',
      'Nb Voix 1T','Statut 2T','Score 2T %'];
    const widths2 = [5,14,22,12,16,26,26,24,10,10,24,10];

    await addLogoHeader(ws2, wb, logoBuffer,
      'Élections Municipales 2026\nRésultats — Conseillers Régionaux Nouvelle-Aquitaine',
      cols2.length);

    applyHdr(ws2, cols2, widths2);
    ws2.views = [{ state:'frozen', xSplit:0, ySplit:ws2.lastRow.number }];

    for (const dept of (depts||[])) {
      const deptCRs = (cr_list||[]).filter(c => c.dept === dept.code);
      if (!deptCRs.length) continue;
      applyDeptRow(ws2, `▶  ${dept.nom} (${dept.code})`, cols2.length);
      let rowCount = 0;

      for (const cr of deptCRs) {
        const bg = rowCount % 2 === 0 ? C_ODD : C_EVEN;
        ws2.addRow([
          cr.dept, dept.nom, cr.nom, cr.groupe,
          cr.commune !== '/' ? cr.commune : null,
          cr.mandat !== '/' ? cr.mandat : null,
          cr.perspective !== '/' ? cr.perspective : null,
          cr.statut || null,
          cr.score_t1 ?? null,
          cr.voix_t1 ?? null,
          cr.statut_t2 || null,
          cr.score_t2 ?? null,
        ]);
        const row = ws2.lastRow;
        row.height = 15;
        row.eachCell({ includeEmpty:true }, (cell, ci) => {
          const val = cell.value;
          if ((ci === 8 || ci === 11) && val) {
            const sc = STATUT_COLORS[String(val)];
            if (sc) {
              cell.fill = cellFill(sc.bg);
              cell.font = cellFont(sc.fg, true, 8);
              cell.alignment = cellAlign('center','middle');
            } else {
              cell.fill = cellFill(bg);
              cell.font = cellFont(C_GREY_FG, false, 9);
              cell.alignment = cellAlign('center','middle');
            }
          } else if ((ci === 9 || ci === 10 || ci === 12) && val !== null) {
            cell.fill = cellFill(bg);
            cell.font = cellFont('FF000000', false, 9);
            cell.alignment = cellAlign('center','middle');
          } else if (ci === 3) {
            cell.fill = cellFill(bg);
            cell.font = cellFont('FF000000', true, 9);
            cell.alignment = cellAlign('left','middle');
          } else {
            cell.fill = cellFill(bg);
            cell.font = cellFont('FF000000', false, 9);
            cell.alignment = cellAlign('left','middle');
          }
        });
        rowCount++;
      }
    }

    // ══════════════════════════════════════════════════════════════
    // ONGLET 3 : SYNTHÈSE PAR BLOC
    // ══════════════════════════════════════════════════════════════
    const ws3 = wb.addWorksheet('Synthèse par Bloc');

    const BLOCS = [
      { label:'PS / PP / PCF / PRG', nuances:['PS','PS/PP','PP','PCF','PRG','UG'] },
      { label:'DVG',                  nuances:['DVG'] },
      { label:'LFI',                  nuances:['LFI'] },
      { label:'Écologistes / Verts',  nuances:['Écolo','EELV','Les Verts','Écologiste','Écologistes'] },
      { label:'Centre / UDI / Horizons', nuances:['RE','Renaissance','UDI','Horizons','DVC','MoDem','Centre/Indé'] },
      { label:'LR / DVD',             nuances:['LR','DVD'] },
      { label:'RN / EXD',             nuances:['RN','EXD'] },
      { label:'Divers / NC',          nuances:['DIV','NC','SE','DV'] },
    ];

    const cols3 = ['Bloc','CR engagés','Victoires 1T','Victoires 2T',
      'Qualifiés 2T','Défaites 1T','Défaites 2T','En attente'];
    const widths3 = [32,12,14,14,14,12,12,12];

    await addLogoHeader(ws3, wb, logoBuffer,
      'Élections Municipales 2026\nSynthèse par Bloc Politique — Nouvelle-Aquitaine',
      cols3.length);
    applyHdr(ws3, cols3, widths3);

    for (const bloc of BLOCS) {
      const crs = (cr_list||[]).filter(c => bloc.nuances.includes(c.groupe));
      let v1=0,v2=0,q=0,d1=0,d2=0,att=0;
      for (const cr of crs) {
        const st = cr.statut || '';
        if (st==='Victoire 1er Tour') v1++;
        else if (st==='Victoire 2nd Tour') v2++;
        else if (st==='Qualifié·e pour le 2nd Tour') q++;
        else if (st==='Défaite 1er Tour') d1++;
        else if (st==='Défaite 2nd Tour') d2++;
        else if (st==='Candidat') att++;
      }
      ws3.addRow([bloc.label, crs.length, v1, v2, q, d1, d2, att]);
      const r = ws3.lastRow;
      r.height = 18;
      r.eachCell({ includeEmpty:true }, (cell, ci) => {
        cell.fill = cellFill(ci===1 ? C_ODD : C_EVEN);
        cell.font = cellFont(ci===1 ? '1A1A2E' : 'FF000000', ci===1, 9);
        cell.alignment = cellAlign(ci===1?'left':'center','middle');
      });
    }

    // ══════════════════════════════════════════════════════════════
    // ONGLET 4 : SYNTHÈSE PAR DÉPARTEMENT
    // ══════════════════════════════════════════════════════════════
    const ws4 = wb.addWorksheet('Synthèse par Département');

    const cols4 = ['Dept','Département','Communes suivies','Listes saisies',
      'Victoires 1T','Victoires 2T','Qualifiés 2T',
      'Défaites 1T','Défaites 2T','CR PS/PP engagés','CR PS/PP élus'];
    const widths4 = [6,18,16,14,13,13,13,12,12,16,14];

    await addLogoHeader(ws4, wb, logoBuffer,
      'Élections Municipales 2026\nSynthèse par Département — Nouvelle-Aquitaine',
      cols4.length);
    applyHdr(ws4, cols4, widths4);

    for (let di = 0; di < (depts||[]).length; di++) {
      const dept = depts[di];
      const bg = di % 2 === 0 ? C_ODD : C_EVEN;
      const deptComs = (communes||[]).filter(c => c.dept === dept.code);
      let v1=0,v2=0,q=0,d1=0,d2=0,total=0;
      for (const com of deptComs) {
        const comKey = `${com.dept}|${com.nom}`;
        const listes = listes_data?.[comKey] || [];
        listes.forEach((_,li) => {
          const rdata = (liste_results||{})[`${comKey}|${li}`] || {};
          const st = rdata.statut_t1 || rdata.statut || '';
          if (st) {
            total++;
            if (st==='Victoire 1er Tour') v1++;
            else if (st==='Victoire 2nd Tour') v2++;
            else if (st==='Qualifié·e pour le 2nd Tour') q++;
            else if (st==='Défaite 1er Tour') d1++;
            else if (st==='Défaite 2nd Tour') d2++;
          }
        });
      }
      const crPspp = (cr_list||[]).filter(c =>
        c.dept===dept.code && PS_GROUPES.includes(c.groupe));
      const crElus = crPspp.filter(c =>
        ['Victoire 1er Tour','Victoire 2nd Tour'].includes(c.statut)).length;

      ws4.addRow([dept.code, dept.nom, deptComs.length, total,
        v1, v2, q, d1, d2, crPspp.length, crElus]);
      const r = ws4.lastRow;
      r.height = 18;
      r.eachCell({ includeEmpty:true }, (cell, ci) => {
        cell.fill = cellFill(bg);
        cell.font = cellFont(ci<=2 ? C_GREY_FG : 'FF000000', false, 9);
        cell.alignment = cellAlign(ci>2?'center':'left','middle');
      });
    }

    // ── Envoi ─────────────────────────────────────────────────────
    const filename = `Municipales2026_NA_Resultats_${date.replace(/\//g,'-')}.xlsx`;
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',`attachment; filename="${filename}"`);
    const buffer = await wb.xlsx.writeBuffer();
    return res.status(200).send(Buffer.from(buffer));

  } catch(err) {
    console.error('Excel generation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
