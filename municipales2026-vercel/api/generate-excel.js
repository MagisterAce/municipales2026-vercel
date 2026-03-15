import ExcelJS from 'exceljs';

// ── Couleurs template ──────────────────────────────────────────────────────
const C_HDR_BG   = 'FF1A1A2E';
const C_HDR_FG   = 'FFFFFFFF';
const C_DEPT_BG  = 'FF2C3E50';
const C_DEPT_FG  = 'FFFFFFFF';
const C_ODD      = 'FFF8F9FA';
const C_EVEN     = 'FFFFFFFF';
const C_GREY_FG  = 'FF888888';
const C_CR_BG    = 'FFEBF5FB';
const C_CR_FG    = 'FF1A5276';
const C_SEP_BG   = 'FFF0F0F0';

const NUANCE_COLORS = {
  PS:'FFC0392B',UG:'FF922B21',DVG:'FFFE7043',PCF:'FF7B241C',
  PRG:'FFA93226',LFI:'FF6C3483','Écolo':'FF1E8449',EELV:'FF1E8449',
  RN:'FF003189',LR:'FF2874A6',DVD:'FF5D6D7E',DVC:'FF1976D2',
  RE:'FF0D47A1',UDI:'FF0288D1',REC:'FF0D0066',EXG:'FF4A235A',
  NC:'FFAAB7B8',DIV:'FF9E9E9E',UD:'FF1976D2',UXD:'FF263238',
  UC:'FF1565C0','MoDem':'FFF57F17','Rég.':'FF6A1B9A',
};
const NUANCE_FG = {
  NC:'FF000000','MoDem':'FF000000',
};

const STATUT_COLORS = {
  'Victoire 1er Tour':           {bg:'FFC8E6C9',fg:'FF1B5E20'},
  'Défaite 1er Tour':            {bg:'FFFFEBEE',fg:'FFB71C1C'},
  'Qualifié·e pour le 2nd Tour': {bg:'FFFFF3E0',fg:'FFE65100'},
  'Victoire 2nd Tour':           {bg:'FFA5D6A7',fg:'FF1B5E20'},
  'Défaite 2nd Tour':            {bg:'FFEF9A9A',fg:'FFC62828'},
};

const ENJEU_COLORS = {
  'très fort':{bg:'FFC0392B',fg:'FFFFFFFF'},
  'fort':     {bg:'FFE67E22',fg:'FFFFFFFF'},
  'moyen':    {bg:'FFF1C40F',fg:'FF000000'},
  'faible':   {bg:'FF27AE60',fg:'FFFFFFFF'},
};

const GROUPE_COLORS = {
  'PS/PP':'FFC0392B',PS:'FFC0392B',PP:'FFC2185B',PCF:'FF7B241C',
  PRG:'FFA93226',LFI:'FF6C3483','Écologistes':'FF1E8449',
  EELV:'FF1E8449','Les Verts':'FF1E8449',DVG:'FFE74C3C',
  RN:'FF003189',LR:'FF2874A6',DVD:'FF5D6D7E','Centre/Indé':'FFF39C12',
  UDI:'FF0288D1','Modem':'FFF57F17','Renaissance':'FFEF6C00',RE:'FFEF6C00',
};
const GROUPE_FG = {
  'Centre/Indé':'FF000000','Modem':'FF000000',
};

const BLOC_COLORS = {
  'PS / PP / PCF / PRG':     {bg:'FFC0392B',fg:'FFFFFFFF'},
  'DVG':                     {bg:'FFE74C3C',fg:'FFFFFFFF'},
  'LFI':                     {bg:'FF6C3483',fg:'FFFFFFFF'},
  'Écologistes / Verts':     {bg:'FF1E8449',fg:'FFFFFFFF'},
  'Centre / UDI / Horizons': {bg:'FFF39C12',fg:'FF000000'},
  'LR / DVD':                {bg:'FF2874A6',fg:'FFFFFFFF'},
  'RN / EXD':                {bg:'FF003189',fg:'FFFFFFFF'},
  'Régionaliste':            {bg:'FF6A1B9A',fg:'FFFFFFFF'},
  'Divers / NC':             {bg:'FF9E9E9E',fg:'FF000000'},
};

const BLOCS = {
  'PS / PP / PCF / PRG': ['PS/PP','PS','PP','PCF','PRG'],
  'DVG':                  ['DVG'],
  'LFI':                  ['LFI'],
  'Écologistes / Verts':  ['EELV','Les Verts','Écologiste','Écologistes'],
  'Centre / UDI / Horizons': ['Centre/Indé','UDI','Horizons','Modem','Renaissance','RE','DVC'],
  'LR / DVD':             ['LR','DVD'],
  'RN / EXD':             ['RN','EXD','UXD'],
  'Régionaliste':         ['Rég.'],
  'Divers / NC':          ['NC','DIV','SE'],
};

function cellFill(bg) {
  return { type:'pattern', pattern:'solid', fgColor:{argb:bg} };
}
function cellFont(fg='FF000000', bold=false, sz=9) {
  return { name:'Arial', size:sz, bold, color:{argb:fg} };
}
function cellAlign(h='left', v='middle', wrap=false) {
  return { horizontal:h, vertical:v, wrapText:wrap };
}

function applyHdr(ws, row, labels, widths) {
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
  const vals = [label, ...Array(ncols-1).fill(null)];
  ws.addRow(vals);
  const r = ws.lastRow;
  r.height = 18;
  ws.mergeCells(r.number, 1, r.number, ncols);
  const c = r.getCell(1);
  c.fill = cellFill(C_DEPT_BG);
  c.font = cellFont(C_DEPT_FG, true, 9);
  c.alignment = cellAlign('left','middle');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'Method not allowed'});
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { depts, communes, listes_data, liste_results, cr_list } = data;

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Groupe Socialiste PP NA';
    wb.created = new Date();

    // ══════════════════════════════════════════════════════════════
    // ONGLET 1 : COMMUNES CLÉS
    // ══════════════════════════════════════════════════════════════
    const ws1 = wb.addWorksheet('Communes Clés');
    ws1.views = [{state:'frozen', xSplit:0, ySplit:1}];

    const cols1 = ['Dept','Département','Commune','Enjeu','Pop.',
      'Maire sortant','CR liés (groupe)','Liste','Nuance','Tête de liste',
      'Statut 1er Tour','Nb Voix 1T','Score 1T %',
      'Statut 2nd Tour','Score 2T %'];
    const widths1 = [5,14,16,10,8,22,22,32,8,22,24,10,9,24,9];
    applyHdr(ws1, 1, cols1, widths1);

    for (const dept of depts) {
      const deptComs = (communes || [])
        .filter(c => c.dept === dept.code)
        .sort((a,b) => {
          const r = {'très fort':0,'fort':1,'moyen':2};
          return (r[a.enjeu]??9)-(r[b.enjeu]??9);
        });
      if (!deptComs.length) continue;

      applyDeptRow(ws1, `▶  ${dept.nom} (${dept.code})`, cols1.length);
      let rowCount = 0;

      for (const com of deptComs) {
        const comKey = `${com.dept}|${com.nom}`;
        const listes = listes_data[comKey] || [];
        const crNoms = (com.cr_lies||[])
          .map(cr => `${cr.nom} (${cr.groupe})`).join(', ');

        const rowsToAdd = listes.length || 1;
        for (let li = 0; li < rowsToAdd; li++) {
          const l = listes[li] || {};
          const rKey = `${com.dept}|${com.nom}|${li}`;
          const res = (liste_results||{})[rKey] || {};
          const st1 = res.statut_t1 || res.statut || '';
          const sc1 = res.score_t1 ?? res.score ?? '';
          const vx1 = res.voix_t1 ?? res.voix ?? '';
          const st2 = res.statut_t2 || '';
          const sc2 = res.score_t2 ?? '';

          const bg = rowCount%2===0 ? C_ODD : C_EVEN;
          const rowVals = [
            li===0 ? com.dept : null,
            li===0 ? dept.nom : null,
            li===0 ? com.nom  : null,
            li===0 ? com.enjeu : null,
            li===0 ? (com.pop||null) : null,
            li===0 ? (com.maire||null) : null,
            li===0 ? (crNoms||null) : null,
            l.libelle||null, l.nuance||null, l.tete||null,
            st1||null, vx1||null, sc1||null,
            st2||null, sc2||null,
          ];

          ws1.addRow(rowVals);
          const r = ws1.lastRow;
          r.height = 16;

          r.eachCell({includeEmpty:true}, (cell, ci) => {
            const val = cell.value;
            cell.font = cellFont('FF000000', false, 9);
            cell.alignment = cellAlign('left','middle');

            if (ci<=2) {
              cell.fill = cellFill(bg);
              cell.font = cellFont(C_GREY_FG, false, 9);
            } else if (ci===4 && val) {
              const ec = ENJEU_COLORS[String(val).toLowerCase()] || {bg:'FF888888',fg:'FFFFFFFF'};
              cell.fill = cellFill(ec.bg);
              cell.font = cellFont(ec.fg, true, 8);
              cell.alignment = cellAlign('center','middle');
            } else if (ci===7 && val) {
              cell.fill = cellFill(C_CR_BG);
              cell.font = cellFont(C_CR_FG, false, 8);
            } else if (ci===9 && val) {
              const nc = NUANCE_COLORS[String(val)] || 'FF888888';
              const nf = NUANCE_FG[String(val)] || 'FFFFFFFF';
              cell.fill = cellFill(nc);
              cell.font = cellFont(nf, true, 8);
              cell.alignment = cellAlign('center','middle');
            } else if (ci===11 && val) {
              const sc = STATUT_COLORS[String(val)];
              if (sc) {
                cell.fill = cellFill(sc.bg);
                cell.font = cellFont(sc.fg, true, 8);
                cell.alignment = cellAlign('center','middle');
              } else { cell.fill = cellFill(bg); }
            } else if (ci===14 && val) {
              const sc = STATUT_COLORS[String(val)];
              if (sc) {
                cell.fill = cellFill(sc.bg);
                cell.font = cellFont(sc.fg, true, 8);
                cell.alignment = cellAlign('center','middle');
              } else { cell.fill = cellFill(bg); }
            } else if (ci===3 && li===0 && val) {
              cell.fill = cellFill(bg);
              cell.font = cellFont('FF000000', true, 9);
            } else {
              cell.fill = cellFill(bg);
            }
          });
          rowCount++;
        }

        // Séparateur
        ws1.addRow(Array(cols1.length).fill(null));
        const sep = ws1.lastRow;
        sep.height = 4;
        sep.eachCell({includeEmpty:true}, cell => {
          cell.fill = cellFill(C_SEP_BG);
        });
      }
    }

    // ══════════════════════════════════════════════════════════════
    // ONGLET 2 : CONSEILLERS RÉGIONAUX
    // ══════════════════════════════════════════════════════════════
    const ws2 = wb.addWorksheet('Conseillers Régionaux');
    ws2.views = [{state:'frozen', xSplit:0, ySplit:1}];

    const cols2 = ['Dept','Département','Nom','Groupe','Commune',
      'Mandat','Perspectives','Statut','Score 1T %','Score 2T %'];
    const widths2 = [5,14,22,12,16,24,24,24,10,10];
    applyHdr(ws2, 1, cols2, widths2);

    for (const dept of depts) {
      const deptCRs = (cr_list||[]).filter(c => c.dept===dept.code);
      if (!deptCRs.length) continue;
      applyDeptRow(ws2, `▶  ${dept.nom} (${dept.code})`, cols2.length);
      let rowCount = 0;

      for (const cr of deptCRs) {
        const bg = rowCount%2===0 ? C_ODD : C_EVEN;
        ws2.addRow([
          cr.dept, dept.nom, cr.nom, cr.groupe,
          cr.commune!=='/'?cr.commune:null,
          cr.mandat!=='/'?cr.mandat:null,
          cr.perspective!=='/'?cr.perspective:null,
          cr.statut||null, cr.s1??null, cr.s2??null,
        ]);
        const r = ws2.lastRow;
        r.height = 16;

        r.eachCell({includeEmpty:true}, (cell, ci) => {
          const val = cell.value;
          if (ci<=2) {
            cell.fill = cellFill(bg);
            cell.font = cellFont(C_GREY_FG, false, 9);
          } else if (ci===3) {
            cell.fill = cellFill(bg);
            cell.font = cellFont('FF000000', true, 9);
          } else if (ci===4 && val) {
            const gc = GROUPE_COLORS[String(val)] || 'FF888888';
            const gf = GROUPE_FG[String(val)] || 'FFFFFFFF';
            cell.fill = cellFill(gc);
            cell.font = cellFont(gf, true, 8);
            cell.alignment = cellAlign('center','middle');
          } else if (ci===8 && val) {
            const sc = STATUT_COLORS[String(val)];
            if (sc) {
              cell.fill = cellFill(sc.bg);
              cell.font = cellFont(sc.fg, true, 8);
              cell.alignment = cellAlign('center','middle');
            } else {
              cell.fill = cellFill(bg);
              cell.font = cellFont('FF888888', false, 8);
              cell.alignment = cellAlign('center','middle');
            }
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
    const cols3 = ['Bloc','CR engagés','Victoires 1T','Victoires 2T',
      'Qualifiés 2T','Défaites 1T','Défaites 2T','En attente'];
    const widths3 = [24,12,12,12,14,12,12,12];
    applyHdr(ws3, 1, cols3, widths3);

    Object.entries(BLOCS).forEach(([label, groupes], bi) => {
      const bg = bi%2===0 ? C_ODD : C_EVEN;
      const crs = (cr_list||[]).filter(c => groupes.includes(c.groupe));
      ws3.addRow([
        label, crs.length,
        crs.filter(c=>c.statut==='Victoire 1er Tour').length,
        crs.filter(c=>c.statut==='Victoire 2nd Tour').length,
        crs.filter(c=>c.statut==='Qualifié·e pour le 2nd Tour').length,
        crs.filter(c=>c.statut==='Défaite 1er Tour').length,
        crs.filter(c=>c.statut==='Défaite 2nd Tour').length,
        crs.filter(c=>c.statut==='Candidat').length,
      ]);
      const r = ws3.lastRow;
      r.height = 18;
      r.eachCell({includeEmpty:true}, (cell, ci) => {
        if (ci===1) {
          const bc = BLOC_COLORS[label] || {bg:'FF888888',fg:'FFFFFFFF'};
          cell.fill = cellFill(bc.bg);
          cell.font = cellFont(bc.fg, true, 9);
          cell.alignment = cellAlign('left','middle');
        } else {
          cell.fill = cellFill(bg);
          cell.font = cellFont('FF000000', false, 9);
          cell.alignment = cellAlign('center','middle');
        }
      });
    });

    // ══════════════════════════════════════════════════════════════
    // ONGLET 4 : SYNTHÈSE PAR DÉPARTEMENT
    // ══════════════════════════════════════════════════════════════
    const ws4 = wb.addWorksheet('Synthèse par Département');
    const cols4 = ['Dept','Département','Communes suivies','Listes saisies',
      'Victoires 1T','Victoires 2T','Qualifiés 2T',
      'Défaites 1T','Défaites 2T','CR PS/PP engagés','CR PS/PP élus'];
    const widths4 = [5,16,15,13,11,11,12,11,11,16,13];
    applyHdr(ws4, 1, cols4, widths4);

    const PS_GROUPES = ['PS/PP','PS','PP','PCF','PRG'];
    depts.forEach((dept, di) => {
      const bg = di%2===0 ? C_ODD : C_EVEN;
      const deptComs = (communes||[]).filter(c=>c.dept===dept.code);
      let v1=0,v2=0,q=0,d1=0,d2=0,total=0;
      for (const com of deptComs) {
        const comKey = `${com.dept}|${com.nom}`;
        const listes = listes_data[comKey] || [];
        listes.forEach((_,li) => {
          const res = (liste_results||{})[`${comKey}|${li}`] || {};
          const st = res.statut_t1 || res.statut || '';
          if (st) {
            total++;
            if(st==='Victoire 1er Tour') v1++;
            if(st==='Victoire 2nd Tour') v2++;
            if(st==='Qualifié·e pour le 2nd Tour') q++;
            if(st==='Défaite 1er Tour') d1++;
            if(st==='Défaite 2nd Tour') d2++;
          }
        });
      }
      const crPspp = (cr_list||[]).filter(c=>c.dept===dept.code && PS_GROUPES.includes(c.groupe));
      const crElus = crPspp.filter(c=>['Victoire 1er Tour','Victoire 2nd Tour'].includes(c.statut)).length;

      ws4.addRow([dept.code, dept.nom, deptComs.length, total,
        v1, v2, q, d1, d2, crPspp.length, crElus]);
      const r = ws4.lastRow;
      r.height = 16;
      r.eachCell({includeEmpty:true}, (cell, ci) => {
        cell.fill = cellFill(bg);
        cell.font = cellFont(ci<=2 ? C_GREY_FG : 'FF000000', false, 9);
        cell.alignment = cellAlign(ci>2?'center':'left','middle');
      });
    });

    // ── Envoi ────────────────────────────────────────────────────
    const date = new Date().toLocaleDateString('fr-FR').replace(/\//g,'-');
    const filename = `Municipales2026_NA_Resultats_${date}.xlsx`;

    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const buffer = await wb.xlsx.writeBuffer();
    return res.status(200).send(Buffer.from(buffer));

  } catch(err) {
    console.error(err);
    return res.status(500).json({error: err.message||'Erreur serveur'});
  }
}
