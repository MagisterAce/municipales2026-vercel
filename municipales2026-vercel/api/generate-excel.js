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
          const vx1
