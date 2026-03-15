import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

// ── Données statiques ──────────────────────────────────────────────────────
const DEPTS = [{"code": "16", "nom": "Charente"}, {"code": "17", "nom": "Charente-Maritime"}, {"code": "19", "nom": "Corrèze"}, {"code": "23", "nom": "Creuse"}, {"code": "24", "nom": "Dordogne"}, {"code": "33", "nom": "Gironde"}, {"code": "40", "nom": "Landes"}, {"code": "47", "nom": "Lot-et-Garonne"}, {"code": "64", "nom": "Pyrénées-Atlantiques"}, {"code": "79", "nom": "Deux-Sèvres"}, {"code": "86", "nom": "Vienne"}, {"code": "87", "nom": "Haute-Vienne"}];
const COMMUNES = [{"dept": "16", "nom": "Angoulême", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Barbezieux-Saint-Hilaire", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Chalais", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Chirac", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Châteauneuf-sur-Charente", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Cognac", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Confolens", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Fléac", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Mathieu Labrousse", "groupe": "PS/PP"}]}, {"dept": "16", "nom": "Gond-Pontouvre", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Jarnac", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "La Couronne", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "La Rochefoucauld-en-Angoumois", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Mérignac", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": [{"nom": "Thierry Trijoulet", "groupe": "PS/PP"}]}, {"dept": "16", "nom": "Rouillac", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Ruelle-sur-Touvre", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Ruffec", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "16", "nom": "Saint-Adjutory", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Patrice Boutenègre", "groupe": "PS/PP"}]}, {"dept": "16", "nom": "Soyaux", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Châtelaillon-Plage", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Dolus-d'Oléron", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Floirac", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Jonzac", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "La Rochelle", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Lagord", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Marennes-Hiers-Brouage", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": [{"nom": "Richard Guerit", "groupe": "RN"}]}, {"dept": "17", "nom": "Meschers-sur-Gironde", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Mérignac", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Rochefort", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Royan", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Saint-Jean-d'Angély", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Saint-Martin-de-Ré", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Saint-Pierre-d'Oléron", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Saintes", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Saujon", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "17", "nom": "Tonnay-Charente", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": [{"nom": "Rémi Justinien", "groupe": "PS/PP"}]}, {"dept": "19", "nom": "Brive-la-Gaillarde", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "19", "nom": "Chanteix", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Françoise Serre", "groupe": "PS/PP"}]}, {"dept": "19", "nom": "Tulle", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "19", "nom": "Ussel", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "23", "nom": "Aubusson", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "23", "nom": "Guéret", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "23", "nom": "La Souterraine", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": [{"nom": "Étienne Lejeune", "groupe": "PS/PP"}]}, {"dept": "24", "nom": "Bergerac", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "24", "nom": "Boulazac Isle Manoire", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": [{"nom": "Fanny Castegnède", "groupe": "PCF"}]}, {"dept": "24", "nom": "Calès", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Christophe Cathus", "groupe": "PS/PP"}]}, {"dept": "24", "nom": "Chalais", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "24", "nom": "La Roque-Gageac", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Jérôme Peyrat", "groupe": "Renaissance"}]}, {"dept": "24", "nom": "Marsac-sur-l'Isle", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "24", "nom": "Périgueux", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "24", "nom": "Ribérac", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "24", "nom": "Saint-Estèphe", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Maryline Forgeneuf", "groupe": "Verts"}]}, {"dept": "24", "nom": "Sarlat-la-Canéda", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "24", "nom": "Siorac-en-Périgord", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Benjamin Delrieux", "groupe": "PS/PP"}]}, {"dept": "24", "nom": "Thiviers", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Colette Langlade", "groupe": "PS/PP"}]}, {"dept": "33", "nom": "Ambarès-et-Lagrave", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Arcachon", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": [{"nom": "Yves Foulon (LR)\nLaurent Lamara (RN)\nVital Baudé (liste DVG)", "groupe": "Verts"}]}, {"dept": "33", "nom": "Artigues-près-Bordeaux", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Audenge", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Bassens", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Blaye", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Bordeaux", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Bruges", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Bègles", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Cabanac-et-Villagrains", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Damien Obrador", "groupe": "RN"}]}, {"dept": "33", "nom": "Carbon-Blanc", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Castillon-la-Bataille", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": [{"nom": "Sandrine Chadourne", "groupe": "RN"}]}, {"dept": "33", "nom": "Cenon", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Créon", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Eysines", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": [{"nom": "Christine Seguineau", "groupe": "Verts"}]}, {"dept": "33", "nom": "Floirac", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Gradignan", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": [{"nom": "Émilie Sarrazin (Verts)\nMarie-Laure Cuvelier", "groupe": "PS/PP"}]}, {"dept": "33", "nom": "Lacanau", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Langon", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Le Bouscat", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Le Haillan", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Lesparre-Médoc", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Libourne", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Lormont", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Martignas-sur-Jalle", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Mérignac", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Parempuyre", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Pessac", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Saint-André-de-Cubzac", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Saint-Aubin-de-Médoc", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": [{"nom": "Christophe Duprat", "groupe": "LR"}]}, {"dept": "33", "nom": "Saint-Estèphe", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Saint-Médard-en-Jalles", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Saint-Savin", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": [{"nom": "Frédérique Joint", "groupe": "RN"}]}, {"dept": "33", "nom": "Sainte-Foy-la-Grande", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Salleboeuf", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Talence", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "33", "nom": "Villenave-d'Ornon", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Aire-sur-l'Adour", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Biscarrosse", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Capbreton", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Dax", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": [{"nom": "Guillaume Laussu", "groupe": "Centre & Indép."}]}, {"dept": "40", "nom": "Grenade-sur-l'Adour", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Hagetmau", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": [{"nom": "Pascale Requenna", "groupe": "Centre & Indép."}]}, {"dept": "40", "nom": "Labenne", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Labouheyre", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Luxey", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Serge Sore", "groupe": "PS/PP"}]}, {"dept": "40", "nom": "Mimizan", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Mont-de-Marsan", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Morcenx-la-Nouvelle", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Ondres", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Parentis-en-Born", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Peyrehorade", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Roquefort", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Saint-Martin-de-Seignanx", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Saint-Paul-lès-Dax", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Saint-Pierre-du-Mont", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Saint-Sever", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": [{"nom": "Arnaud Tauzin", "groupe": "LR"}]}, {"dept": "40", "nom": "Saint-Vincent-de-Tyrosse", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Sanguinet", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Soustons", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": [{"nom": "Frédérique Charpenel", "groupe": "PS/PP"}]}, {"dept": "40", "nom": "Tarnos", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Tartas", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Vieux-Boucau-les-Bains", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "40", "nom": "Villeneuve-de-Marsan", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "47", "nom": "Agen", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "47", "nom": "Aiguillon", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "47", "nom": "Cocumont", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Jean-Luc Armand", "groupe": "PRG"}]}, {"dept": "47", "nom": "Le Passage", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "47", "nom": "Marmande", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "47", "nom": "Roquefort", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "47", "nom": "Saint-Front-sur-Lémance", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Marie Costes", "groupe": "LR"}]}, {"dept": "47", "nom": "Tonneins", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "47", "nom": "Villeneuve-sur-Lot", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Anglet", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Artix", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Jean-Marie Bergeret-Tercq", "groupe": "PS/PP"}]}, {"dept": "64", "nom": "Bayonne", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Biarritz", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Bidart", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Billère", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Boucau", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Cambo-les-Bains", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Ciboure", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": [{"nom": "Émilie Dutoya", "groupe": "PS/PP"}]}, {"dept": "64", "nom": "Gan", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Hasparren", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Hendaye", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": [{"nom": "Béatrice Tariol", "groupe": "PCF"}]}, {"dept": "64", "nom": "Idron", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Jurançon", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Labatmale", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Florent Lacarrère", "groupe": "PS/PP"}]}, {"dept": "64", "nom": "Lescar", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Lons", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Monein", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Mourenx", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Nay", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Ogeu-les-Bains", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Marc Oxibar", "groupe": "LR"}]}, {"dept": "64", "nom": "Oloron-Sainte-Marie", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Orthez", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Pau", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Saint-Jean-de-Luz", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Saint-Pée-sur-Nivelle", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Salies-de-Béarn", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Urrugne", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "64", "nom": "Ustaritz", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "79", "nom": "Bressuire", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "79", "nom": "Les Châteliers", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Nicolas Gamache", "groupe": "Verts"}]}, {"dept": "79", "nom": "Magné", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Pascal Duforestelle", "groupe": "PS/PP"}]}, {"dept": "79", "nom": "Marigny", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Guillaume Riou", "groupe": "PS/PP"}]}, {"dept": "79", "nom": "Niort", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": [{"nom": "Christelle Chassagne", "groupe": "PS/PP"}]}, {"dept": "79", "nom": "Parthenay", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "79", "nom": "Thouars", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "86", "nom": "Archigny", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Éric Soulat", "groupe": "RN"}]}, {"dept": "86", "nom": "Chalais", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "86", "nom": "Châtellerault", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "86", "nom": "Magné", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "86", "nom": "Mignaloux-Beauvoir", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "86", "nom": "Montmorillon", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "86", "nom": "Poitiers", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "86", "nom": "Saint-Savin", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "86", "nom": "Ternay", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Thierry Perreau", "groupe": "Verts"}]}, {"dept": "87", "nom": "Aixe-sur-Vienne", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "87", "nom": "Ambazac", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "87", "nom": "Bessines-sur-Gartempe", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Andréa Brouille", "groupe": "PS/PP"}]}, {"dept": "87", "nom": "Couzeix", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "87", "nom": "Eymoutiers", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": [{"nom": "Mélanie Plazanet", "groupe": "PS/PP"}]}, {"dept": "87", "nom": "Feytiat", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "87", "nom": "Isle", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "87", "nom": "Le Palais-sur-Vienne", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}, {"dept": "87", "nom": "Limoges", "enjeu": "très fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "87", "nom": "Panazol", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "87", "nom": "Saint-Junien", "enjeu": "fort", "pop": "", "maire": "", "cr_lies": []}, {"dept": "87", "nom": "Saint-Léonard-de-Noblat", "enjeu": "faible", "pop": "", "maire": "", "cr_lies": []}, {"dept": "87", "nom": "Saint-Yrieix-la-Perche", "enjeu": "moyen", "pop": "", "maire": "", "cr_lies": []}];
const LISTES_DATA = {"16|Angoulême": [{"nuance": "DVD", "libelle": "ANGOULEME VOUS AIME", "tete": "Vincent YOU", "color": "#888888"}, {"nuance": "DVD", "libelle": "L'essentiel c'est vous !", "tete": "Xavier BONNEFONT", "color": "#888888"}, {"nuance": "DVG", "libelle": "CHOISISSONS ANGOULEME AVEC PATRICK MARDIKIAN", "tete": "Patrick MARDIKIAN", "color": "#888888"}, {"nuance": "EXG", "libelle": "Lutte ouvrière - Le camp des travailleurs", "tete": "Olivier NICOLAS", "color": "#888888"}, {"nuance": "LFI", "libelle": "L'union populaire Angoulême", "tete": "Anne-Aziliz PETIT-LOUBOUTIN", "color": "#888888"}, {"nuance": "PS", "libelle": "CHANGER LA VILLE", "tete": "Raphaël MANZANAS", "color": "#888888"}, {"nuance": "REC", "libelle": "Agir Pour Angoulême", "tete": "Jean-Christophe COMPAIN", "color": "#888888"}, {"nuance": "RN", "libelle": "REDESSINONS ANGOULÊME", "tete": "Didier PEIRIN", "color": "#888888"}, {"nuance": "Écolo", "libelle": "Angoulême Collectif 2026", "tete": "Christophe DUHOUX-SALABERRY", "color": "#888888"}], "16|Barbezieux-Saint-Hilaire": [{"nuance": "DVD", "libelle": "Un nouveau souffle à l'écoute de tous pour Barbezieux-St-Hilaire", "tete": "Stéphane DEGAS", "color": "#888888"}, {"nuance": "DVD", "libelle": "Ensemble à Barbezieux Saint Hilaire, Agissons pour l'avenir", "tete": "Vincent RENAUDIN", "color": "#888888"}], "16|Chalais": [], "16|Chirac": [], "16|Châteauneuf-sur-Charente": [{"nuance": "DVG", "libelle": "Ensemble continuons à prendre soin de Châteauneuf", "tete": "Jean-Louis LEVESQUE", "color": "#888888"}], "16|Cognac": [{"nuance": "DVD", "libelle": "Notre parti c'est Cognac", "tete": "Morgan BERGER", "color": "#888888"}, {"nuance": "DVG", "libelle": "Cognac Mérite Mieux", "tete": "Romuald CARRY", "color": "#888888"}, {"nuance": "RN", "libelle": "RASSEMBLER COGNAC", "tete": "Adrien HOFFMANN", "color": "#888888"}], "16|Confolens": [{"nuance": "DVD", "libelle": "CONFOLENS, UN ELAN VERS L'AVENIR", "tete": "Jean-Noël DUPRÉ", "color": "#888888"}], "16|Fléac": [{"nuance": "DVG", "libelle": "RéUnis Pour Fléac", "tete": "Hélène GINGAST", "color": "#888888"}], "16|Gond-Pontouvre": [{"nuance": "DVC", "libelle": "Gond-Pontouvre, Un Nouvel Elan", "tete": "Geoffroy ROBIN", "color": "#888888"}, {"nuance": "DVG", "libelle": "Gond-Pontouvre c'est vous !", "tete": "Bertrand MAGNANON", "color": "#888888"}, {"nuance": "DVG", "libelle": "DEMAIN VOUS APPARTIENT", "tete": "Maryline VINET", "color": "#888888"}], "16|Jarnac": [{"nuance": "DVC", "libelle": "Jarnac, un nouvel élan", "tete": "Anne MARTRON", "color": "#888888"}, {"nuance": "DVC", "libelle": "Pour Jarnac", "tete": "Jérôme ROYER", "color": "#888888"}], "16|La Couronne": [{"nuance": "DIV", "libelle": "La Couronne au coeur, agir ensemble pour vous", "tete": "Fabienne DOUCET", "color": "#888888"}, {"nuance": "DVG", "libelle": "LA COURONNE DEMAIN AVEC VOUS", "tete": "Jean-François DAURÉ", "color": "#888888"}], "16|La Rochefoucauld-en-Angoumois": [{"nuance": "DIV", "libelle": "CAP SUR L'AVENIR CONSTRUISONS ENSEMBLE", "tete": "Sébastien RIVIÈRE", "color": "#888888"}, {"nuance": "DVC", "libelle": "Réussir Ensemble", "tete": "Danne AUMEYRAS-CHAIGNE", "color": "#888888"}, {"nuance": "DVC", "libelle": "La Rochefoucauld en Angoumois  Nos Territoires, Notre Ambition", "tete": "Eric PINTAUD", "color": "#888888"}, {"nuance": "DVG", "libelle": "Collectif La Rochefoucauld St Projet en commun[e]", "tete": "Michaël LABLANCHE", "color": "#888888"}], "16|Mérignac": [], "16|Rouillac": [], "16|Ruelle-sur-Touvre": [{"nuance": "DVG", "libelle": "RUELLE AVEC VOUS", "tete": "Annie MARC", "color": "#888888"}, {"nuance": "DVG", "libelle": "RUELLE TERRE DE LIENS", "tete": "Murielle DEZIER", "color": "#888888"}], "16|Ruffec": [], "16|Saint-Adjutory": [], "16|Soyaux": [{"nuance": "DIV", "libelle": "UNIS POUR SOYAUX", "tete": "Frédéric CROS", "color": "#888888"}, {"nuance": "DVC", "libelle": "Ensemble préparons l'avenir", "tete": "François NEBOUT", "color": "#888888"}, {"nuance": "DVG", "libelle": "SOYAUX COLLECTIF 2026", "tete": "William JACQUILLARD", "color": "#888888"}, {"nuance": "LFI", "libelle": "SOYAUX POPULAIRE", "tete": "Sulay CHAZETTE", "color": "#888888"}], "17|Châtelaillon-Plage": [{"nuance": "DVD", "libelle": "PASSIONNEMENT CHATELAILLON-PLAGE", "tete": "Stéphane VILLAIN", "color": "#888888"}, {"nuance": "DVG", "libelle": "CHÂTELAILLON AUTREMENT !", "tete": "Jérôme BLAUTH", "color": "#888888"}], "17|Dolus-d'Oléron": [], "17|Floirac": [], "17|Jonzac": [{"nuance": "DVC", "libelle": "JONZAC, COEUR BATTANT", "tete": "Jean-François MOUGARD", "color": "#888888"}, {"nuance": "DVD", "libelle": "Une énergie commune pour JONZAC", "tete": "Christophe CABRI", "color": "#888888"}], "17|La Rochelle": [{"nuance": "DVD", "libelle": "Une vision pour La Rochelle", "tete": "Christophe BATCABE", "color": "#888888"}, {"nuance": "DVG", "libelle": "POUR LES ROCHELAISES ET LES ROCHELAIS", "tete": "Olivier FALORNI", "color": "#888888"}, {"nuance": "DVG", "libelle": "GÉNÉRATIONS LA ROCHELLE AVEC THIBAUT GUIRAUD", "tete": "Thibaut GUIRAUD", "color": "#888888"}, {"nuance": "EXG", "libelle": "LUTTE OUVRIERE", "tete": "Antoine COLIN", "color": "#888888"}, {"nuance": "LFI", "libelle": "LA ROCHELLE INSOUMISE ET POPULAIRE", "tete": "Véronique BONNET", "color": "#888888"}, {"nuance": "RN", "libelle": "RASSEMBLEMENT LA ROCHELLE", "tete": "Séverine WERBROUCK", "color": "#888888"}, {"nuance": "UG", "libelle": "LA ROCHELLE UNIE", "tete": "Maryline SIMONÉ", "color": "#888888"}], "17|Lagord": [{"nuance": "DVC", "libelle": "LAGORD AUTREMENT", "tete": "Bruno BARBIER", "color": "#888888"}, {"nuance": "DVG", "libelle": "LAGORD ENSEMBLE", "tete": "Séverine LACOSTE", "color": "#888888"}], "17|Marennes-Hiers-Brouage": [{"nuance": "DVG", "libelle": "Nouvelle Equipe, Nouveau Cap avec Marianne Luqué", "tete": "Mariane LUQUÉ", "color": "#888888"}, {"nuance": "RN", "libelle": "ENSEMBLE VERS UN AVENIR MEILLEUR POUR MARENNES-HIERS-BROUAGE", "tete": "Richard GUERIT", "color": "#888888"}], "17|Meschers-sur-Gironde": [], "17|Mérignac": [], "17|Rochefort": [{"nuance": "DVD", "libelle": "HERVÉ BLANCHÉ 2026 CONTINUONS ENSEMBLE", "tete": "Hervé BLANCHÉ", "color": "#888888"}, {"nuance": "DVG", "libelle": "ROCHEFORT, L'AVENIR AUTREMENT", "tete": "Fabrice VERGNIER", "color": "#888888"}, {"nuance": "DVG", "libelle": "Rochefort Collectif", "tete": "Romain MONROUX", "color": "#888888"}, {"nuance": "EXG", "libelle": "Lutte ouvrière - le camp des travailleurs", "tete": "Anne-Catherine GODDE", "color": "#888888"}], "17|Royan": [{"nuance": "DVC", "libelle": "NOUVEL'R", "tete": "Thomas LAFARIE", "color": "#888888"}, {"nuance": "DVD", "libelle": "AVEC VOUS POUR ROYAN", "tete": "Patrick MARENGO", "color": "#888888"}, {"nuance": "RN", "libelle": "ROYAN RENOUVEAU", "tete": "Nicolas CALBRIX", "color": "#888888"}, {"nuance": "UG", "libelle": "ROYAN A GAUCHE", "tete": "Jacques GUIARD", "color": "#888888"}], "17|Saint-Jean-d'Angély": [{"nuance": "DIV", "libelle": "L'HUMAIN AU COEUR", "tete": "Frédéric RASSE", "color": "#888888"}, {"nuance": "DVD", "libelle": "ANGERIENS UNIS", "tete": "Jacques CASTAGNET", "color": "#888888"}, {"nuance": "PS", "libelle": "ANGERIENS ET FIERS D'AGIR", "tete": "Françoise MESNARD", "color": "#888888"}], "17|Saint-Martin-de-Ré": [], "17|Saint-Pierre-d'Oléron": [{"nuance": "DVD", "libelle": "BIEN VIVRE EN OLÉRON", "tete": "Christophe SUEUR", "color": "#888888"}, {"nuance": "DVG", "libelle": "Saint-Pierre d'Oléron à Coeur", "tete": "Philippe RAYNAL", "color": "#888888"}, {"nuance": "RN", "libelle": "Saint-Pierre réussir l'avenir avec vous", "tete": "Bernard NICLOT", "color": "#888888"}], "17|Saintes": [{"nuance": "DVC", "libelle": "L'IMPORTANT , C'EST VOUS", "tete": "Bruno DRAPRON", "color": "#888888"}, {"nuance": "DVC", "libelle": "J'AIME SAINTES", "tete": "Jean-Philippe MACHON", "color": "#888888"}, {"nuance": "DVD", "libelle": "SAINTES AU QUOTIDIEN", "tete": "Laurent DAVIET", "color": "#888888"}, {"nuance": "DVG", "libelle": "SAINTES DEMAIN", "tete": "Ludovic NORIGEON", "color": "#888888"}, {"nuance": "LFI", "libelle": "SAINTES SOLIDAIRE ET CITOYENNE", "tete": "Rémy CATROU", "color": "#888888"}], "17|Saujon": [{"nuance": "DVC", "libelle": "SAUJON : OSONS LE CHANGEMENT !", "tete": "Jean-Luc GENSAC", "color": "#888888"}, {"nuance": "DVC", "libelle": "SAUJON - L'EXPÉRIENCE D'AUJOURD'HUI, L'ÉNERGIE DE DEMAIN", "tete": "Pascal FERCHAUD", "color": "#888888"}, {"nuance": "RN", "libelle": "PROCHE DE VOUS, POUR SAUJON", "tete": "Isabelle LEMAIRE", "color": "#888888"}], "17|Tonnay-Charente": [{"nuance": "DVD", "libelle": "PROJETS TONNACQUOIS", "tete": "Fernand TROALE", "color": "#888888"}, {"nuance": "PS", "libelle": "Tonnay avec Vous", "tete": "Rémi JUSTINIEN", "color": "#888888"}], "19|Brive-la-Gaillarde": [{"nuance": "DVD", "libelle": "UN PROJET POUR BRIVE", "tete": "Frédéric SOULIER", "color": "#888888"}, {"nuance": "DVG", "libelle": "Brive notre avenir", "tete": "Paul ROCHE", "color": "#888888"}, {"nuance": "UG", "libelle": "UNI.E.S POUR BRIVE, DÉMOCRATIQUE,ÉCOLOGIQUE, SOCIALE", "tete": "Sophie MARCUCCI", "color": "#888888"}, {"nuance": "UXD", "libelle": "TOUT POUR BRIVE ! AVEC VALÉRY ELOPHE", "tete": "Valéry ELOPHE", "color": "#888888"}], "19|Chanteix": [], "19|Tulle": [{"nuance": "DVD", "libelle": "Tulle, l'énergie qui nous unit", "tete": "Laurent MELIN", "color": "#888888"}, {"nuance": "DVG", "libelle": "Le pouvoir d'agir", "tete": "Bernard COMBES", "color": "#888888"}, {"nuance": "RN", "libelle": "Rassemblons-nous pour Tulle", "tete": "Thierry GRECK", "color": "#888888"}, {"nuance": "UG", "libelle": "Ensemble pour Tulle", "tete": "Nicolas MARLIN", "color": "#888888"}], "19|Ussel": [{"nuance": "DIV", "libelle": "Unis pour Ussel", "tete": "Jean-Pierre GUITARD", "color": "#888888"}, {"nuance": "DVD", "libelle": "USSEL, CAP VERS DEMAIN", "tete": "Christophe ARFEUILLERE", "color": "#888888"}, {"nuance": "DVG", "libelle": "Ussel ensemble !", "tete": "Pierrick CRONNIER", "color": "#888888"}], "23|Aubusson": [{"nuance": "DVG", "libelle": "AUBUSSON, UNE ÉQUIPE, UN AVENIR", "tete": "Stéphane DUCOURTIOUX", "color": "#888888"}, {"nuance": "LFI", "libelle": "LA COMMUNE", "tete": "Gregorio YONG VIVAS", "color": "#888888"}, {"nuance": "UDP", "libelle": "ENSEMBLE FAISONS REVIVRE AUBUSSON", "tete": "Marilyn MONBUREAU", "color": "#888888"}], "23|Guéret": [{"nuance": "DIV", "libelle": "L'ÉNERGIE DU COLLECTIF", "tete": "Marie-Françoise FOURNIER", "color": "#888888"}, {"nuance": "DVD", "libelle": "RÉVEILLONS GUÉRET !", "tete": "Philippe MICARD", "color": "#888888"}, {"nuance": "DVD", "libelle": "Avec vous, changeons Guéret !", "tete": "Thierry DELAITRE", "color": "#888888"}, {"nuance": "DVG", "libelle": "Guéret mérite mieux", "tete": "Eric CORREIA", "color": "#888888"}, {"nuance": "EXD", "libelle": "UNIS POUR GUÉRET, LISTE DE RASSEMBLEMENT DES DROITES", "tete": "Eric RAPINAT", "color": "#888888"}, {"nuance": "LFI", "libelle": "GUÉRET EN CAMPAGNE À GAUCHE", "tete": "François-Louis COULON", "color": "#888888"}, {"nuance": "UG", "libelle": "S'ENGAGER POUR GUÉRET", "tete": "Didier HOELTGEN", "color": "#888888"}], "23|La Souterraine": [{"nuance": "DVD", "libelle": "UN NOUVEAU SOUFFLE POUR LA SOUTERRAINE", "tete": "André LEROY", "color": "#888888"}, {"nuance": "UG", "libelle": "UNE VOLONTÉ PARTAGÉE POUR LA SOUTERRAINE", "tete": "Étienne LEJEUNE", "color": "#888888"}], "24|Bergerac": [{"nuance": "DIV", "libelle": "BERGERAC POUR VOUS", "tete": "Thierry ROUX", "color": "#888888"}, {"nuance": "DVD", "libelle": "PRIOLEAUD 2026-L'ENERGIE CITOYENNE", "tete": "Jonathan PRIOLEAUD", "color": "#888888"}, {"nuance": "RN", "libelle": "Bergerac, une vision pour l'avenir!", "tete": "Christian GERARD", "color": "#888888"}, {"nuance": "UG", "libelle": "Bergerac au Quotidien", "tete": "Fabien RUET", "color": "#888888"}], "24|Boulazac Isle Manoire": [{"nuance": "DVG", "libelle": "ENSEMBLE POUR BOULAZAC ISLE MANOIRE", "tete": "Fanny CASTAIGNEDE", "color": "#888888"}, {"nuance": "DVG", "libelle": "VIVONS BOULAZAC ISLE MANOIRE", "tete": "Jérémy PIERRE-NADAL", "color": "#888888"}], "24|Calès": [], "24|Chalais": [], "24|La Roque-Gageac": [], "24|Marsac-sur-l'Isle": [], "24|Périgueux": [{"nuance": "DVD", "libelle": "PERIGUEUX ENSEMBLE", "tete": "Antoine AUDI", "color": "#888888"}, {"nuance": "DVD", "libelle": "UNIR PERIGUEUX", "tete": "Michel CADET", "color": "#888888"}, {"nuance": "EXG", "libelle": "LUTTE OUVRIERE - LE CAMP DES TRAVAILLEURS", "tete": "Jonathan ALMOSNINO", "color": "#888888"}, {"nuance": "LFI", "libelle": "PERIGUEUX EN COMMUN", "tete": "Vincent BELLOTEAU", "color": "#888888"}, {"nuance": "UG", "libelle": "Périgueux nous rassemble", "tete": "Emeric LAVITOLA", "color": "#888888"}], "24|Ribérac": [{"nuance": "DVC", "libelle": "AGIR ENSEMBLE POUR RIBERAC", "tete": "Philippe CHOTARD", "color": "#888888"}, {"nuance": "DVD", "libelle": "UNIS POUR RIBERAC !", "tete": "Franck BLANCHARDIE", "color": "#888888"}, {"nuance": "DVG", "libelle": "RIBERAC DEMAIN !", "tete": "Nicolas PLATON", "color": "#888888"}], "24|Saint-Estèphe": [], "24|Sarlat-la-Canéda": [{"nuance": "DVD", "libelle": "AVEC ET POUR LES SARLADAIS", "tete": "Basile FANIER", "color": "#888888"}, {"nuance": "DVD", "libelle": "AGIR ENSEMBLE POUR SARLAT-LA-CANÉDA", "tete": "Franck DUVAL", "color": "#888888"}, {"nuance": "DVG", "libelle": "AUJOURD'HUI ET DEMAIN SARLAT-LA-CANÉDA", "tete": "Fabienne LAGOUBIE", "color": "#888888"}, {"nuance": "DVG", "libelle": "SARLAT 2026 LA RELEVE", "tete": "Luis FERREYRA", "color": "#888888"}, {"nuance": "RN", "libelle": "Sarlat un nouveau souffle", "tete": "Guillaume FORQUET DE DORNE", "color": "#888888"}], "24|Siorac-en-Périgord": [], "24|Thiviers": [], "33|Ambarès-et-Lagrave": [{"nuance": "DIV", "libelle": "UN NOUVEL ELAN", "tete": "David POULAIN", "color": "#888888"}, {"nuance": "DIV", "libelle": "AGIR ENSEMBLE POUR AMBARES ET LAGRAVE", "tete": "Stéphane MAVEYRAUD", "color": "#888888"}, {"nuance": "DVG", "libelle": "AMBITIONS AMBARES ET LAGRAVE", "tete": "Nordine GUENDEZ", "color": "#888888"}, {"nuance": "EXD", "libelle": "REPENSONS NOTRE AVENIR", "tete": "Olivier MARTINEZ", "color": "#888888"}], "33|Arcachon": [{"nuance": "DVG", "libelle": "ARCACHON AVENIR", "tete": "Vital BAUDE", "color": "#888888"}, {"nuance": "LR", "libelle": "Arcachon ensemble", "tete": "Yves FOULON", "color": "#888888"}, {"nuance": "RN", "libelle": "VIVRE ARCACHON 2026 !", "tete": "Laurent LAMARA", "color": "#888888"}], "33|Artigues-près-Bordeaux": [{"nuance": "DVC", "libelle": "Ensemble pour Artigues", "tete": "Claude DAUVILLIER", "color": "#888888"}, {"nuance": "DVG", "libelle": "Artigues J'aime", "tete": "Alain GARNIER", "color": "#888888"}, {"nuance": "RN", "libelle": "UN AVENIR SÛR POUR ARTIGUES", "tete": "Éléonore DA GAMA", "color": "#888888"}], "33|Audenge": [{"nuance": "DIV", "libelle": "AUDENGE2026 - VOTEZ POUR VOUS", "tete": "Alexandre CARTIGNY", "color": "#888888"}, {"nuance": "DIV", "libelle": "Audenge, Cap vers l'Avenir", "tete": "Kevin BRUSTIS", "color": "#888888"}, {"nuance": "DIV", "libelle": "AUDENGE DYNAMIQUE ET HUMAINE", "tete": "Nathalie LE YONDRE", "color": "#888888"}, {"nuance": "DVC", "libelle": "AGIR POUR AUDENGE", "tete": "Fabrice BROCHOT", "color": "#888888"}], "33|Bassens": [{"nuance": "DVG", "libelle": "L'ESPRIT BASSENS", "tete": "Alexandre RUBIO", "color": "#888888"}, {"nuance": "RN", "libelle": "Bassens, une ville qui nous rassemble", "tete": "Floriane GOURCEAUD", "color": "#888888"}], "33|Blaye": [{"nuance": "DVC", "libelle": "Blaye Territoire d'Avenir", "tete": "Eric JAPIOT", "color": "#888888"}, {"nuance": "DVD", "libelle": "Cap sur demain", "tete": "Bernard MOINET", "color": "#888888"}, {"nuance": "DVG", "libelle": "Blaye, c'est vous !", "tete": "Virginie GIROTTI", "color": "#888888"}], "33|Bordeaux": [{"nuance": "DVC", "libelle": "PHILIPPE DESSERTINE- L'OPTIMISME EST UNE FORCE", "tete": "Philippe DESSERTINE", "color": "#888888"}, {"nuance": "DVG", "libelle": "UNION DE LA GAUCHE", "tete": "Medhi SABOULARD", "color": "#888888"}, {"nuance": "EXG", "libelle": "NPA Révolutionnaires - Bordeaux Ouvrière et Révolutionnaire", "tete": "Esteban NADAL", "color": "#888888"}, {"nuance": "EXG", "libelle": "Lutte ouvrière - le camp des travailleurs", "tete": "Fanny QUANDALLE", "color": "#888888"}, {"nuance": "EXG", "libelle": "ARRACHER BORDEAUX AUX RICHES ET AUX SPÉCULATEURS", "tete": "Petra BERNUS", "color": "#888888"}, {"nuance": "EXG", "libelle": "ROUGE BORDEAUX ANTICAPITALISTE", "tete": "Philippe POUTOU", "color": "#888888"}, {"nuance": "LFI", "libelle": "FAIRE MIEUX POUR BORDEAUX", "tete": "Nordine RAYMOND", "color": "#888888"}, {"nuance": "REC", "libelle": "A LA RECONQUÊTE DE BORDEAUX", "tete": "Virginie BONTOUX TOURNAY", "color": "#888888"}, {"nuance": "RN", "libelle": "RASSEMBLEMENT NATIONAL POUR BORDEAUX", "tete": "Julie RECHAGNEUX", "color": "#888888"}, {"nuance": "UC", "libelle": "Faire Gagner Bordeaux", "tete": "Thomas CAZENAVE", "color": "#888888"}, {"nuance": "UG", "libelle": "BORDEAUX EN CONFIANCE", "tete": "Pierre HURMIC", "color": "#888888"}], "33|Bruges": [{"nuance": "DVC", "libelle": "UNE VOIX POUR BRUGES", "tete": "Michaël GISQUET", "color": "#888888"}, {"nuance": "DVD", "libelle": "ENSEMBLE BOUGEONS BRUGES", "tete": "Fabienne DUMAS", "color": "#888888"}, {"nuance": "DVG", "libelle": "BAC", "tete": "Frederic GIRO", "color": "#888888"}], "33|Bègles": [{"nuance": "DIV", "libelle": "ESPOIR BÉGLAIS", "tete": "Christian BAGATE", "color": "#888888"}, {"nuance": "EXG", "libelle": "LUTTE OUVRIERE - LE CAMP DES TRAVAILLEURS", "tete": "Jacques GULDNER", "color": "#888888"}, {"nuance": "LFI", "libelle": "FAIRE MIEUX POUR BEGLES", "tete": "Loic PRUD'HOMME", "color": "#888888"}, {"nuance": "RN", "libelle": "LE COURAGE D'AGIR POUR BEGLES", "tete": "Maryvonne BASTÈRES", "color": "#888888"}, {"nuance": "UG", "libelle": "VIVONS BEGLES ENSEMBLE", "tete": "Clement ROSSIGNOL PUECH", "color": "#888888"}], "33|Cabanac-et-Villagrains": [], "33|Carbon-Blanc": [{"nuance": "DIV", "libelle": "CAP2026 POUR CARBON-BLANC AVEC Yohann GIACOMETTI", "tete": "Yohann GIACOMETTI", "color": "#888888"}, {"nuance": "DVG", "libelle": "VIVRE CARBON-BLANC", "tete": "Patrick LABESSE", "color": "#888888"}], "33|Castillon-la-Bataille": [], "33|Cenon": [{"nuance": "DIV", "libelle": "ENSEMBLE POUR CENON", "tete": "Florence DAMET", "color": "#888888"}, {"nuance": "EXG", "libelle": "C'est nous qui travaillons, c'est nous qui decidons!", "tete": "Christine HÉRAUD", "color": "#888888"}, {"nuance": "LFI", "libelle": "CIES", "tete": "Fabrice DELAUNE", "color": "#888888"}, {"nuance": "UG", "libelle": "ENSEMBLE, NOUS SOMMES CENON", "tete": "Jean-François EGRON", "color": "#888888"}], "33|Créon": [{"nuance": "DVG", "libelle": "Créon avec Vous", "tete": "Stéphane SANCHIS", "color": "#888888"}, {"nuance": "DVG", "libelle": "Créon Notre Commune", "tete": "Sylvie DESMOND", "color": "#888888"}, {"nuance": "RN", "libelle": "APC", "tete": "Alexis FEBBRARI", "color": "#888888"}], "33|Eysines": [{"nuance": "DVC", "libelle": "FIERS D'EYSINES", "tete": "Arnaud DERUMAUX", "color": "#888888"}, {"nuance": "DVG", "libelle": "TOUJOURS AVEC VOUS POUR EYSINES", "tete": "Christine BOST", "color": "#888888"}, {"nuance": "RN", "libelle": "Du Changement pour Eysines", "tete": "Pierre-Henri NIVET", "color": "#888888"}], "33|Floirac": [{"nuance": "DIV", "libelle": "POUR FLOIRAC 2026", "tete": "Xavier MONIOT-LUNDY", "color": "#888888"}, {"nuance": "LFI", "libelle": "Faire mieux pour Floirac", "tete": "Didier PARIS", "color": "#888888"}, {"nuance": "UG", "libelle": "Floirac, une commune pour vous, avec vous!", "tete": "Jean-Jacques PUYOBRAU", "color": "#888888"}], "33|Gradignan": [{"nuance": "DVD", "libelle": "GRADIGNAN POSITIVE ATTITUDE", "tete": "Michel LABARDIN", "color": "#888888"}, {"nuance": "RN", "libelle": "UN NOUVEL ÉLAN POUR GRADIGNAN", "tete": "Anaïs CURDY", "color": "#888888"}, {"nuance": "UG", "libelle": "GRADIGNAN DEMAIN AVEC ÉMILIE SARRAZIN", "tete": "Emilie SARRAZIN", "color": "#888888"}], "33|Lacanau": [{"nuance": "DIV", "libelle": "LACANAU DEMAIN", "tete": "Benoit BERQUE", "color": "#888888"}, {"nuance": "DIV", "libelle": "VIVONS LACANAU AVEC LAURENT PEYRONDET", "tete": "Laurent PEYRONDET", "color": "#888888"}, {"nuance": "DIV", "libelle": "LACANAU. NATURELLEMENT", "tete": "Rodolphe INDIA", "color": "#888888"}], "33|Langon": [{"nuance": "DVD", "libelle": "REVEILLER LANGON", "tete": "Florence LASSARADE", "color": "#888888"}, {"nuance": "DVG", "libelle": "GUILLEM 2026", "tete": "Jérôme GUILLEM", "color": "#888888"}, {"nuance": "EXG", "libelle": "Lutte ouvrière - Le camp des travailleurs", "tete": "Jean-Philippe DELCAMP", "color": "#888888"}, {"nuance": "RN", "libelle": "Le renouveau pour Langon", "tete": "François-Xavier MARQUES", "color": "#888888"}], "33|Le Bouscat": [{"nuance": "DVD", "libelle": "GL2026EB", "tete": "Gwenaël LAMARQUE", "color": "#888888"}, {"nuance": "DVG", "libelle": "L'ELAN CITOYEN", "tete": "Claire LAYAN", "color": "#888888"}, {"nuance": "RN", "libelle": "DYNAMISONS LE BOUSCAT !", "tete": "Ivan GRATTE", "color": "#888888"}, {"nuance": "UG", "libelle": "LBC", "tete": "Carola Tiana CASTELNEAU", "color": "#888888"}], "33|Le Haillan": [{"nuance": "DVC", "libelle": "LHAEP", "tete": "Eric POULLIAT", "color": "#888888"}, {"nuance": "DVD", "libelle": "POUR LE HAILLAN 2026", "tete": "Xavier CAMPS", "color": "#888888"}, {"nuance": "UG", "libelle": "NOUS SOMMES LE HAILLAN", "tete": "Andrea KISS", "color": "#888888"}], "33|Lesparre-Médoc": [{"nuance": "DIV", "libelle": "LA LISTE PLURIELLE LESPARRE 2026", "tete": "Bernard GUIRAUD", "color": "#888888"}, {"nuance": "RN", "libelle": "PROTEGEONS ET DYNAMISONS LESPARRE", "tete": "Valérie CHAPOU", "color": "#888888"}], "33|Libourne": [{"nuance": "DVD", "libelle": "Notre parti c'est Libourne", "tete": "Christophe GIGOT", "color": "#888888"}, {"nuance": "DVG", "libelle": "Libourne!", "tete": "Philippe BUISSON", "color": "#888888"}, {"nuance": "EXD", "libelle": "Une ligne droite pour Libourne", "tete": "Franck DANIEL DE ROLAND", "color": "#888888"}, {"nuance": "EXG", "libelle": "Lutte ouvrière - Le camp des travailleurs", "tete": "Hélène HALBIN", "color": "#888888"}, {"nuance": "LFI", "libelle": "Libourne s'engage pour la paix", "tete": "Denis MAUGET", "color": "#888888"}], "33|Lormont": [{"nuance": "DIV", "libelle": "ENSEMBLE LORMONT", "tete": "Taner OZKOSAR", "color": "#888888"}, {"nuance": "EXG", "libelle": "C'EST NOUS QUI TRAVAILLONS, C'EST NOUS QUI DECIDONS", "tete": "Monica CASANOVA", "color": "#888888"}, {"nuance": "EXG", "libelle": "LUTTE OUVRIERE - LE CAMP DES TRAVAILLEURS", "tete": "Patrick PRET", "color": "#888888"}, {"nuance": "RN", "libelle": "LORMONT : Transparence et Avenir", "tete": "Serge BLÜGE", "color": "#888888"}, {"nuance": "UG", "libelle": "POUR LORMONT AVEC LORMONT", "tete": "Philippe QUERTINMONT", "color": "#888888"}], "33|Martignas-sur-Jalle": [{"nuance": "DIV", "libelle": "Aimer Martignas 2026", "tete": "Grégory ADIER", "color": "#888888"}, {"nuance": "DVD", "libelle": "ENSEMBLE, MARTIGNAS AVANCE !", "tete": "Jérôme PESCINA", "color": "#888888"}, {"nuance": "DVG", "libelle": "VIVONS MARTIGNAS", "tete": "Eric GENTIEU", "color": "#888888"}], "33|Mérignac": [{"nuance": "DVD", "libelle": "MERIGNAC NOUS RASSEMBLE", "tete": "Thierry MILLET", "color": "#888888"}, {"nuance": "EXG", "libelle": "LO", "tete": "Guillaume PERCHET", "color": "#888888"}, {"nuance": "LFI", "libelle": "Faire Mieux pour Mérignac", "tete": "Loan PANIFOUS", "color": "#888888"}, {"nuance": "RN", "libelle": "L'ALTERNANCE POUR MERIGNAC", "tete": "Jimmy BOURLIEUX", "color": "#888888"}, {"nuance": "UG", "libelle": "ENSEMBLE, NOUS SOMMES MERIGNAC", "tete": "Thierry TRIJOULET", "color": "#888888"}], "33|Parempuyre": [{"nuance": "DIV", "libelle": "PAREMPUYRE NOUS INSPIRE !", "tete": "Jennifer MICHALAK", "color": "#888888"}, {"nuance": "DVD", "libelle": "PAREMPUYRE AVENIR", "tete": "Henri LAGARRIGUE", "color": "#888888"}, {"nuance": "UG", "libelle": "PAREMPUYRE PROCHE DE VOUS", "tete": "Loïc ROZIER-DUPLANTIER", "color": "#888888"}], "33|Pessac": [{"nuance": "DVC", "libelle": "UPP", "tete": "Bérangère COUILLARD", "color": "#888888"}, {"nuance": "DVD", "libelle": "AVEC FRANCK RAYNAL, FIERS D'ÊTRE PESSACAIS", "tete": "Franck RAYNAL", "color": "#888888"}, {"nuance": "EXG", "libelle": "ANTICAPITALISTES ET REVOLUTIONNAIRES", "tete": "Isabelle UFFERTE", "color": "#888888"}, {"nuance": "LFI", "libelle": "PESSAC INSOUMISE", "tete": "Philippe JAOUEN", "color": "#888888"}, {"nuance": "RN", "libelle": "L'ALTERNANCE POUR PESSAC", "tete": "Hervé DOSSAT", "color": "#888888"}, {"nuance": "UG", "libelle": "PESSAC ENSEMBLE", "tete": "Sébastien SAINT-PASTEUR", "color": "#888888"}], "33|Saint-André-de-Cubzac": [{"nuance": "DIV", "libelle": "Collectif Citoyen: La Voix des Habitants", "tete": "Thierry LIÈVRE-CORMIER", "color": "#888888"}, {"nuance": "DVD", "libelle": "UNIS pour changer Saint-André", "tete": "Vincent CHARRIER", "color": "#888888"}, {"nuance": "DVG", "libelle": "Bien vivre à Saint-André", "tete": "Michel VILATTE", "color": "#888888"}, {"nuance": "DVG", "libelle": "Saint André Nous Rassemble", "tete": "Mickaël COURSEAUX", "color": "#888888"}, {"nuance": "RN", "libelle": "L'alernance pour Saint-André", "tete": "Pierre LE CAMUS", "color": "#888888"}], "33|Saint-Aubin-de-Médoc": [{"nuance": "DVD", "libelle": "AGIR POUR SAINT-AUBIN", "tete": "Christophe DUPRAT", "color": "#888888"}], "33|Saint-Estèphe": [], "33|Saint-Médard-en-Jalles": [{"nuance": "DIV", "libelle": "NOUVEL ELAN POUR SAINT-MEDARD", "tete": "Marie-Odile PICARD", "color": "#888888"}, {"nuance": "DVC", "libelle": "AGIR POUR SAINT MÉDARD", "tete": "Jacques MANGON", "color": "#888888"}, {"nuance": "DVG", "libelle": "SMEJEC", "tete": "Stéphane DELPEYRAT-VINCENT", "color": "#888888"}, {"nuance": "RN", "libelle": "LE CHANGEMENT N'ATTEND PLUS !", "tete": "Patrice LICATA", "color": "#888888"}], "33|Saint-Savin": [{"nuance": "DVG", "libelle": "Saint-Savin, naturellement", "tete": "Jean-Luc BESSE", "color": "#888888"}, {"nuance": "RN", "libelle": "Saint-Savin : Nouveau cap, nouvelle ere", "tete": "Frédérique JOINT", "color": "#888888"}], "33|Sainte-Foy-la-Grande": [], "33|Salleboeuf": [], "33|Talence": [{"nuance": "DVC", "libelle": "TE", "tete": "Emmanuel SALLABERRY", "color": "#888888"}, {"nuance": "UG", "libelle": "VIVONS TALENCE", "tete": "Isabelle RAMI", "color": "#888888"}], "33|Villenave-d'Ornon": [{"nuance": "DVD", "libelle": "Du Souffle, Du Sens", "tete": "Michel POIGNONEC", "color": "#888888"}, {"nuance": "LFI", "libelle": "Faisons mieux pour Villenave d'Ornon", "tete": "Guillaume LATRILLE", "color": "#888888"}, {"nuance": "UG", "libelle": "POUR VILLENAVE D'ORNON L'ALTERNATIVE ECOLOGIQUE ET SOCIALE", "tete": "Stéphanie ANFRAY", "color": "#888888"}], "40|Aire-sur-l'Adour": [{"nuance": "DVD", "libelle": "AGIR ENSEMBLE POUR UN AVENIR SEREIN", "tete": "Xavier LAGRAVE", "color": "#888888"}, {"nuance": "DVG", "libelle": "Mieux vivre à Aire", "tete": "Jérémy MARTI", "color": "#888888"}], "40|Biscarrosse": [{"nuance": "DVD", "libelle": "Passionnément Biscarrosse", "tete": "Hélène LARREZET", "color": "#888888"}, {"nuance": "DVG", "libelle": "Biscarrosse Autrement", "tete": "Patrick DORVILLE", "color": "#888888"}], "40|Capbreton": [{"nuance": "DVC", "libelle": "Capbreton par Nature", "tete": "Jean-Luc ASCHARD", "color": "#888888"}, {"nuance": "DVC", "libelle": "Capbreton au Coeur", "tete": "Louis GALDOS", "color": "#888888"}, {"nuance": "DVC", "libelle": "Capbreton Nouveau Cap", "tete": "Serge MACKOWIAK", "color": "#888888"}], "40|Dax": [{"nuance": "DVD", "libelle": "VIVONS DAX ! Notre énergie, votre avenir!", "tete": "Julien DUBOIS", "color": "#888888"}, {"nuance": "UG", "libelle": "Pour Dax à 100 %", "tete": "Viviane LOUMÉ-SEIXO", "color": "#888888"}], "40|Grenade-sur-l'Adour": [], "40|Hagetmau": [{"nuance": "DVC", "libelle": "HAGETMAU AU COEUR", "tete": "Pascale REQUENNA", "color": "#888888"}, {"nuance": "DVG", "libelle": "HAGETMAU, une autre voie", "tete": "Jérôme TOFFOLI", "color": "#888888"}], "40|Labenne": [{"nuance": "DVG", "libelle": "Pour Labenne avec vous! Liste de gauche et d'ouverture", "tete": "Stéphanie CHESSOUX", "color": "#888888"}], "40|Labouheyre": [], "40|Luxey": [], "40|Mimizan": [{"nuance": "DVC", "libelle": "Mimizan pour vous, avec nous", "tete": "Guy CASSAGNE", "color": "#888888"}, {"nuance": "UG", "libelle": "MIMIZAN ENSEMBLE", "tete": "Frédéric POMAREZ", "color": "#888888"}], "40|Mont-de-Marsan": [{"nuance": "DVC", "libelle": "RASSEMBLER TOUT LE MONT2", "tete": "Geneviève DARRIEUSSECQ", "color": "#888888"}, {"nuance": "DVD", "libelle": "Pour Mont de Marsan aujourd'hui et demain", "tete": "Charles DAYOT", "color": "#888888"}, {"nuance": "DVG", "libelle": "MARSAN CITOYEN", "tete": "Diane Laure LEGODOU", "color": "#888888"}, {"nuance": "RN", "libelle": "Se rassembler pour Mont-de-Marsan", "tete": "Nicolas LEREGLE", "color": "#888888"}, {"nuance": "UG", "libelle": "MONT-DE-MARSAN AUTREMENT", "tete": "Frédéric DUTIN", "color": "#888888"}], "40|Morcenx-la-Nouvelle": [{"nuance": "DVC", "libelle": "LA NOUVELLE MORCENX", "tete": "Fabrice LACHENMAIER", "color": "#888888"}, {"nuance": "DVG", "libelle": "La Nouvelle, Vivons Collectif !", "tete": "Paul CARRERE", "color": "#888888"}], "40|Ondres": [{"nuance": "DVC", "libelle": "ESPOIR ET SERENITE POUR LES ONDRAIS", "tete": "Patrick DE CASANOVE", "color": "#888888"}, {"nuance": "DVG", "libelle": "ONDRES AVEC VOUS", "tete": "Eva BELIN", "color": "#888888"}, {"nuance": "DVG", "libelle": "Ondres Unie", "tete": "Murielle O'BYRNE", "color": "#888888"}], "40|Parentis-en-Born": [{"nuance": "DIV", "libelle": "POURPARENTIS", "tete": "Yoann DUBOURG", "color": "#888888"}, {"nuance": "DVC", "libelle": "UNION CITOYENNE POUR PARENTIS", "tete": "Marie-Françoise NADAU", "color": "#888888"}, {"nuance": "DVG", "libelle": "Mieux Vivre Ensemble à Parentis", "tete": "Georges LALUQUE", "color": "#888888"}], "40|Peyrehorade": [{"nuance": "DIV", "libelle": "CONSTRUISONS ENSEMBLE LE PEYREHORADE DE DEMAIN", "tete": "Patxi GRENADE", "color": "#888888"}, {"nuance": "DVD", "libelle": "Ecouter, partager, agir pour Peyrehorade", "tete": "Philippe LAFITTE", "color": "#888888"}, {"nuance": "DVG", "libelle": "VIVRE À PEYREHORADE", "tete": "Michel DISCAZEAUX", "color": "#888888"}], "40|Roquefort": [], "40|Saint-Martin-de-Seignanx": [{"nuance": "DVC", "libelle": "SAINT-MARTIN, NOTRE PROJET", "tete": "Carine GLEIZES", "color": "#888888"}, {"nuance": "DVC", "libelle": "Saint Martin Coeur de Seignanx", "tete": "Olivier BARRIERE", "color": "#888888"}, {"nuance": "DVG", "libelle": "VIVRE ENSEMBLE SAINT-MARTIN", "tete": "Julien FICHOT", "color": "#888888"}], "40|Saint-Paul-lès-Dax": [{"nuance": "DVC", "libelle": "Construisons notre avenir, Protégeons notre cadre de vie", "tete": "Catherine RABA", "color": "#888888"}, {"nuance": "DVG", "libelle": "ENSEMBLE, SAINT-PAUL AVANCE", "tete": "Julien BAZUS", "color": "#888888"}], "40|Saint-Pierre-du-Mont": [{"nuance": "DVC", "libelle": "LE COEUR DANS L'ACTION POUR SAINT-PIERRE-DU-MONT", "tete": "Joël BONNET", "color": "#888888"}, {"nuance": "UG", "libelle": "MIEUX VIVRE A SAINT PIERRE", "tete": "Julien PARIS", "color": "#888888"}], "40|Saint-Sever": [{"nuance": "DVG", "libelle": "SAINT-SEVIVRE ENSEMBLE", "tete": "Cedric MALLET", "color": "#888888"}, {"nuance": "UD", "libelle": "J'aime Saint-Sever", "tete": "Arnaud TAUZIN", "color": "#888888"}], "40|Saint-Vincent-de-Tyrosse": [{"nuance": "DVG", "libelle": "Ensemble pour Tyrosse", "tete": "Régis GELEZ", "color": "#888888"}], "40|Sanguinet": [{"nuance": "DVC", "libelle": "ESPRIT SANGUINET", "tete": "Fabien LAINÉ", "color": "#888888"}, {"nuance": "DVG", "libelle": "VIVRE SANGUINET", "tete": "Laurent MOLIN", "color": "#888888"}, {"nuance": "DVG", "libelle": "SANGUINET AUTREMENT", "tete": "Nathalie SOUBAIGNE", "color": "#888888"}], "40|Soustons": [{"nuance": "DVD", "libelle": "SOUSTONS 2026 LE CHANGEMENT C'EST VOUS !", "tete": "Philippe SAINT-MARTIN", "color": "#888888"}, {"nuance": "DVG", "libelle": "FREDERIQUE CHARPENEL 2026 SOUSTONS UNE VILLE A VIVRE", "tete": "Frederique CHARPENEL", "color": "#888888"}], "40|Tarnos": [{"nuance": "DVC", "libelle": "Agir pour Tarnos", "tete": "Antoine ROBLES", "color": "#888888"}, {"nuance": "DVC", "libelle": "TARNOS POUR TOUS", "tete": "Marie-Ange DELAVENNE", "color": "#888888"}, {"nuance": "UG", "libelle": "Tarnos Ensemble", "tete": "Marc MABILLET", "color": "#888888"}], "40|Tartas": [], "40|Vieux-Boucau-les-Bains": [], "40|Villeneuve-de-Marsan": [], "47|Agen": [{"nuance": "EXG", "libelle": "CONTRE LEUR ÉCONOMIE DE GUERRE, AGEN POUR LES TRAVAILLEURS ET LA JEUNESSE", "tete": "Eric LAFOND", "color": "#888888"}, {"nuance": "UC", "libelle": "AGEN AU COEUR", "tete": "Jean DIONIS", "color": "#888888"}, {"nuance": "UG", "libelle": "VIVEMENT AGEN", "tete": "Laurent BRUNEAU", "color": "#888888"}, {"nuance": "UXD", "libelle": "AGEN EN ACTION", "tete": "Sébastien DELBOSQ", "color": "#888888"}], "47|Aiguillon": [{"nuance": "DIV", "libelle": "UN CAP POUR AIGUILLON", "tete": "Martine TOULMONDE", "color": "#888888"}, {"nuance": "DIV", "libelle": "AIGUILLON, LE FUTUR NOUS APPARTIENT", "tete": "Nicole MOSCHION", "color": "#888888"}, {"nuance": "DVD", "libelle": "CONTINUONS À AGIR POUR AIGUILLON", "tete": "Christian GIRARDI", "color": "#888888"}, {"nuance": "EXG", "libelle": "MIEUX VIVRE ENSEMBLE À AIGUILLON", "tete": "Sylvio GUINGAN", "color": "#888888"}], "47|Cocumont": [], "47|Le Passage": [{"nuance": "DVC", "libelle": "LE PASSAGE C'EST VOUS !", "tete": "Corinne GRIFFOND", "color": "#888888"}, {"nuance": "DVD", "libelle": "PASSAGE VERS L'AVENIR", "tete": "Gilles FRÉMY", "color": "#888888"}, {"nuance": "DVG", "libelle": "LE PASSAGE AUTREMENT", "tete": "Delphine EYCHENNE", "color": "#888888"}, {"nuance": "DVG", "libelle": "CONTINUONS ENSEMBLE POUR LE PASSAGE !", "tete": "Francis GARCIA", "color": "#888888"}], "47|Marmande": [{"nuance": "DVD", "libelle": "CLAIREMENT MARMANDE", "tete": "Martine CALZAVARA", "color": "#888888"}, {"nuance": "DVD", "libelle": "MARMANDE AVENIR", "tete": "Valérie PÉRALI", "color": "#888888"}, {"nuance": "DVG", "libelle": "POUR MARMANDE !", "tete": "Joël HOCQUELET", "color": "#888888"}, {"nuance": "EXD", "libelle": "RASSEMBLONS NOUS POUR MARMANDE", "tete": "Jean-Luc DUBOURG", "color": "#888888"}, {"nuance": "UXD", "libelle": "UN NOUVEAU CAP POUR MARMANDE", "tete": "André BELACEL", "color": "#888888"}], "47|Roquefort": [], "47|Saint-Front-sur-Lémance": [], "47|Tonneins": [{"nuance": "DVC", "libelle": "ALLIANCE CITOYENNE POUR TONNEINS", "tete": "Denis BERTOLASO", "color": "#888888"}, {"nuance": "DVD", "libelle": "UN ELAN DE PLUS POUR TONNEINS", "tete": "Dany TITONEL", "color": "#888888"}, {"nuance": "DVG", "libelle": "TONNEINS AU COEUR", "tete": "Jérémie BESPÉA", "color": "#888888"}], "47|Villeneuve-sur-Lot": [{"nuance": "DIV", "libelle": "Souffle citoyen 2026", "tete": "Stephane BOUKHARI", "color": "#888888"}, {"nuance": "DVD", "libelle": "GARDONS LE CAP", "tete": "Guillaume LEPERS", "color": "#888888"}, {"nuance": "DVG", "libelle": "VILLENEUVE C'EST VOUS !", "tete": "Thomas BOUYSSONNIE", "color": "#888888"}, {"nuance": "UXD", "libelle": "UNION POUR VILLENEUVE", "tete": "Geoffroy Ludovic Jean-Luc GARY", "color": "#888888"}], "64|Anglet": [{"nuance": "DVD", "libelle": "NATURELLEMENT ANGLET", "tete": "Claude OLIVE", "color": "#888888"}, {"nuance": "Rég.", "libelle": "Anglet se pense ici, Hemen Angelu", "tete": "Enaut Beñat ALFARO", "color": "#888888"}, {"nuance": "UG", "libelle": "ANGLET ENSEMBLE", "tete": "Mahaut FANCHINI", "color": "#888888"}], "64|Artix": [], "64|Bayonne": [{"nuance": "DVC", "libelle": "BAYONNE L'ESSENTIEL C'EST VOUS !", "tete": "Jean-René ETCHEGARAY", "color": "#888888"}, {"nuance": "EXD", "libelle": "Unis pour Bayonne l'Alternative !", "tete": "Pascal LESELLIER", "color": "#888888"}, {"nuance": "LFI", "libelle": "Bayonne insoumise et populaire", "tete": "Sandra PEREIRA-OSTANEL", "color": "#888888"}, {"nuance": "UG", "libelle": "BAYONNE TOUT SIMPLEMENT !", "tete": "Henri ETCHETO", "color": "#888888"}, {"nuance": "UG", "libelle": "BAYONNE EN MOUVEMENT-BAIONA MUGIMENDUAN", "tete": "Jean Claude IRIART", "color": "#888888"}], "64|Biarritz": [{"nuance": "DVC", "libelle": "BIARRITZ NOUVELLE VAGUE", "tete": "Guillaume BARUCQ", "color": "#888888"}, {"nuance": "DVC", "libelle": "CAP BIARRITZ", "tete": "Jean-Baptiste DUSSAUSSOIS LARRALDE", "color": "#888888"}, {"nuance": "DVC", "libelle": "MON EQUIPE C'EST BIARRITZ !", "tete": "Serge BLANCO", "color": "#888888"}, {"nuance": "DVD", "libelle": "Ensemble, vivons Biarritz", "tete": "Maïder AROSTEGUY", "color": "#888888"}, {"nuance": "DVD", "libelle": "Biarritz d'abord", "tete": "Richard TARDITS", "color": "#888888"}, {"nuance": "UG", "libelle": "BIARRITZ BERRI AVEC ET POUR LES BIARROTS", "tete": "Ana EZCURRA", "color": "#888888"}], "64|Bidart": [{"nuance": "DVD", "libelle": "BIDART AU COEUR / BIDARTE BIHOTZETIK", "tete": "Emmanuel ALZURI", "color": "#888888"}, {"nuance": "DVG", "libelle": "BIDART PAR NATURE", "tete": "Michel LAMARQUE", "color": "#888888"}], "64|Billère": [{"nuance": "DIV", "libelle": "IL EST TEMPS POUR BILLÈRE", "tete": "Vincent ESCUDÉ", "color": "#888888"}, {"nuance": "DVG", "libelle": "BILLÈRE POUR TOUS", "tete": "Arnaud JACOTTIN", "color": "#888888"}], "64|Boucau": [{"nuance": "DVD", "libelle": "AGIR ENSEMBLE POUR LE BOUCAU", "tete": "Guy BOULANGER", "color": "#888888"}, {"nuance": "DVG", "libelle": "BOUCAU CONVIVIAL ET DEVELOPPEMENT DURABLE", "tete": "Francis GONZALEZ", "color": "#888888"}, {"nuance": "DVG", "libelle": "VIVONS BOUCAU - Un élan citoyen", "tete": "Mathieu HORN", "color": "#888888"}, {"nuance": "PCF", "libelle": "BOUCAU AU COEUR POUR UNE VILLE PLURIELLE ET SOLIDAIRE", "tete": "Hélène ETCHENIQUE", "color": "#888888"}], "64|Cambo-les-Bains": [{"nuance": "DVD", "libelle": "Cambo en avant - \"Jo Aintzina\"", "tete": "Christian DEVEZE", "color": "#888888"}, {"nuance": "Rég.", "libelle": "NAHI DUGUN HERRIA / LA COMMUNE QUE NOUS VOULONS", "tete": "Argitxu HIRIART-URRUTY", "color": "#888888"}, {"nuance": "Rég.", "libelle": "KANBO ELKARTU", "tete": "Peio ETXELEKU", "color": "#888888"}], "64|Ciboure": [{"nuance": "DVD", "libelle": "CIBOURE AU COEUR", "tete": "Jean-Louis POULOU", "color": "#888888"}, {"nuance": "Rég.", "libelle": "ZIBURU BIZI 2026", "tete": "Eneko ALDANA-DOUAT", "color": "#888888"}], "64|Gan": [{"nuance": "DVD", "libelle": "GAN, L'AVENIR ENSEMBLE", "tete": "Francis PÉES", "color": "#888888"}, {"nuance": "DVG", "libelle": "NATURELLEMENT GAN", "tete": "Valérie CAMBON", "color": "#888888"}], "64|Hasparren": [{"nuance": "DVG", "libelle": "Hazparne bihotzean, Hasparren au coeur", "tete": "Isabelle PARGADE", "color": "#888888"}, {"nuance": "Rég.", "libelle": "HERRITARREKIN", "tete": "Michel OSPITAL", "color": "#888888"}], "64|Hendaye": [{"nuance": "DVD", "libelle": "VIVRE HENDAYE - l'avenir vous appartient !", "tete": "Tristan PROTEAU", "color": "#888888"}, {"nuance": "Rég.", "libelle": "HENDAIA BILTZEN - Uni.e.s pour Hendaye", "tete": "Laetitia NAVARRON", "color": "#888888"}, {"nuance": "UG", "libelle": "HENDAYE EMSEMBLE - HENDAIA ELGARREKIN", "tete": "Kotte ECENARRO", "color": "#888888"}], "64|Idron": [{"nuance": "DIV", "libelle": "AVEC VOUS POUR IDRON", "tete": "André NAHON", "color": "#888888"}, {"nuance": "DIV", "libelle": "Idron, tissons l'avenir ensemble", "tete": "Karine PÉRÉ", "color": "#888888"}, {"nuance": "DVD", "libelle": "Valorisons Idron", "tete": "Annie HILD", "color": "#888888"}], "64|Jurançon": [{"nuance": "DVC", "libelle": "JURANÇON AU COEUR", "tete": "Michel BERNOS", "color": "#888888"}, {"nuance": "DVG", "libelle": "JURANÇON A VENIR", "tete": "Patrice BADUEL", "color": "#888888"}], "64|Labatmale": [], "64|Lescar": [{"nuance": "DIV", "libelle": "LESCAR A COEUR VAILLANT", "tete": "Jérôme MANGE", "color": "#888888"}, {"nuance": "DVG", "libelle": "POUR VOUS et AVEC VOUS, CONTINUONS ENSEMBLE", "tete": "Valérie REVEL", "color": "#888888"}, {"nuance": "RN", "libelle": "L'ALTERNANCE POUR LESCAR", "tete": "François VERRIERE", "color": "#888888"}], "64|Lons": [{"nuance": "DVG", "libelle": "ALTERNATIVES LONSOISES", "tete": "Eric BOURDET", "color": "#888888"}, {"nuance": "LR", "libelle": "LONS POUR TOUS", "tete": "Nicolas PATRIARCHE", "color": "#888888"}], "64|Monein": [{"nuance": "DIV", "libelle": "POUR MONEIN, CONTINUONS ENSEMBLE", "tete": "Bertrand VERGEZ-PASCAL", "color": "#888888"}, {"nuance": "DIV", "libelle": "MONEIN, UNIS AUJOURD'HUI POUR DEMAIN - VAM CAMINAR", "tete": "Yves SALANAVE-PÉHÉ", "color": "#888888"}], "64|Mourenx": [{"nuance": "DVG", "libelle": "VIVE MOURENX !", "tete": "Lindsey DEARY", "color": "#888888"}, {"nuance": "DVG", "libelle": "MOURENX AVEC VOUS", "tete": "Patrice LAURENT", "color": "#888888"}], "64|Nay": [], "64|Ogeu-les-Bains": [], "64|Oloron-Sainte-Marie": [{"nuance": "DVD", "libelle": "Le Renouveau Oloronais", "tete": "Clément SERVAT", "color": "#888888"}, {"nuance": "LR", "libelle": "Réveillons Oloron Avec Hugo Couchinave", "tete": "Hugo COUCHINAVE", "color": "#888888"}, {"nuance": "UG", "libelle": "Oser Oloron Ensemble", "tete": "Marie-Lyse BISTUÉ", "color": "#888888"}], "64|Orthez": [{"nuance": "DIV", "libelle": "ORTHEZ C'EST NOUS TOUS !", "tete": "Benjamin MOUTET", "color": "#888888"}, {"nuance": "DVG", "libelle": "Ensemble Construisons l'Avenir ORTHEZ SAINTE-SUZANNE", "tete": "Jeanne LAMAZERE DESTUGUES", "color": "#888888"}, {"nuance": "EXG", "libelle": "Une Mairie à l'offensive : 100% Services publics, 100% Jeunesse, 100% Citoyen.ne.s", "tete": "Eric DELTEIL", "color": "#888888"}, {"nuance": "RN", "libelle": "ORTHEZ RASSEMBLÉE", "tete": "Nicolas CRESSON", "color": "#888888"}], "64|Pau": [{"nuance": "DIV", "libelle": "PAU, C'EST VOUS !", "tete": "Pascal BONIFACE", "color": "#888888"}, {"nuance": "DIV", "libelle": "ARRAOU AVEC VOUS", "tete": "Philippe ARRAOU", "color": "#888888"}, {"nuance": "DVC", "libelle": "NOUS AIMONS PAU", "tete": "François BAYROU", "color": "#888888"}, {"nuance": "EXG", "libelle": "LUTTE OUVRIERE - LE CAMP DES TRAVAILLEURS", "tete": "Cyrille MARCONI", "color": "#888888"}, {"nuance": "LFI", "libelle": "PAU INSOUMISE ECOLOGISTE ET CITOYENNE", "tete": "Jean-François BLANCO", "color": "#888888"}, {"nuance": "RN", "libelle": "L'ESPÉRANCE POUR PAU", "tete": "Margaux TAILLEFER", "color": "#888888"}, {"nuance": "UG", "libelle": "NOUVELLE ÈRE", "tete": "Jérôme MARBOT", "color": "#888888"}], "64|Saint-Jean-de-Luz": [{"nuance": "DVC", "libelle": "Manuel de LARA,un nouvel élan,avec vous", "tete": "Manuel DE LARA", "color": "#888888"}, {"nuance": "DVG", "libelle": "Donibanen Bizi : Vivre à Saint-Jean-de-Luz", "tete": "Pascal LAFITTE", "color": "#888888"}, {"nuance": "EXG", "libelle": "LUTTE OUVRIERE - LE CAMP DES TRAVAILLEURS", "tete": "Jacqueline Pierrette UHART", "color": "#888888"}, {"nuance": "UD", "libelle": "SAINT-JEAN PASSIONNEMENT", "tete": "Jean-François IRIGOYEN", "color": "#888888"}], "64|Saint-Pée-sur-Nivelle": [{"nuance": "DVD", "libelle": "AGIR POUR SAINT PEE", "tete": "Bernard ELHORGA", "color": "#888888"}, {"nuance": "Rég.", "libelle": "HATS BERRI - NOUVEL ELAN", "tete": "Christophe JAUREGUY", "color": "#888888"}, {"nuance": "Rég.", "libelle": "ELGARREKIN SENPERERENTZAT-ENSEMBLE POUR SAINT-PEE", "tete": "Mariana LAUGIER", "color": "#888888"}], "64|Salies-de-Béarn": [{"nuance": "DIV", "libelle": "Salies Unie", "tete": "Frédéric DOMERCQ", "color": "#888888"}, {"nuance": "DVD", "libelle": "SALIES Pour Vous", "tete": "Thierry CABANNE", "color": "#888888"}], "64|Urrugne": [{"nuance": "DVC", "libelle": "VIVONS URRUGNE AUTREMENT / ONGI BIZI URRUÑAN", "tete": "Sébastien ETCHEBARNE", "color": "#888888"}, {"nuance": "DVD", "libelle": "DU COEUR ET DES ACTES", "tete": "Martine MIGNOT-CARMÉ", "color": "#888888"}, {"nuance": "Rég.", "libelle": "ELGARREKIN URRUGNE", "tete": "Philippe ARAMENDI", "color": "#888888"}], "64|Ustaritz": [{"nuance": "DVG", "libelle": "ENSEMBLE POUR USTARITZ", "tete": "Bruno CENDRES", "color": "#888888"}, {"nuance": "Rég.", "libelle": "UZTARITZE BAI", "tete": "Piero ROUGET", "color": "#888888"}], "79|Bressuire": [{"nuance": "DIV", "libelle": "BRESSUIRE ET VOUS", "tete": "Emmanuelle MÉNARD", "color": "#888888"}, {"nuance": "DVG", "libelle": "Bressuire autrement", "tete": "Pierre MORIN", "color": "#888888"}], "79|Les Châteliers": [], "79|Magné": [], "79|Marigny": [], "79|Niort": [{"nuance": "DVC", "libelle": "Niort, c'est tous ensemble!", "tete": "Jérôme BALOGE", "color": "#888888"}, {"nuance": "RN", "libelle": "ENSEMBLE, osons le changement pour Niort", "tete": "Céline BONNET-DERISBOURG", "color": "#888888"}, {"nuance": "UG", "libelle": "Niort à Gauche", "tete": "Sébastien MATHIEU", "color": "#888888"}], "79|Parthenay": [{"nuance": "DVC", "libelle": "DiverCité", "tete": "Jean-Michel PRIEUR", "color": "#888888"}, {"nuance": "DVD", "libelle": "NOUVEL ELAN POUR PARTHENAY", "tete": "Béatrice LARGEAU", "color": "#888888"}], "79|Thouars": [{"nuance": "DVG", "libelle": "Thouars en commun", "tete": "Axel URBAIN", "color": "#888888"}, {"nuance": "DVG", "libelle": "Thouars pour ambition", "tete": "Bernard PAINEAU", "color": "#888888"}], "86|Archigny": [], "86|Chalais": [], "86|Châtellerault": [{"nuance": "DVC", "libelle": "NOUS SOMMES CHATELLERAULT", "tete": "Thomas BAUDIN", "color": "#888888"}, {"nuance": "DVD", "libelle": "ASSURONS VOTRE AVENIR", "tete": "Anne-Florence BOURAT", "color": "#888888"}, {"nuance": "EXG", "libelle": "LUTTE OUVRIERE-LE CAMP DES TRAVAILLEURS", "tete": "Patrice VILLERET", "color": "#888888"}, {"nuance": "LFI", "libelle": "Fier(e)s de Châtellerault", "tete": "Maxime NOIROT", "color": "#888888"}, {"nuance": "MoDem", "libelle": "AVEC VOUS CHATELLERAULT EN GRAND", "tete": "David SIMON", "color": "#888888"}, {"nuance": "RN", "libelle": "RASSEMBLER POUR AGIR", "tete": "Hager JACQUEMIN", "color": "#888888"}, {"nuance": "UDI", "libelle": "AGIR POUR VOUS", "tete": "Manuel COSTA NOBRE", "color": "#888888"}, {"nuance": "UG", "libelle": "CHANGER D'ÈRE", "tete": "Dominique PASQUET", "color": "#888888"}], "86|Magné": [], "86|Mignaloux-Beauvoir": [{"nuance": "DIV", "libelle": "AGIR ENSEMBLE POUR MIGNALOUX-BEAUVOIR", "tete": "Patrick FERRER", "color": "#888888"}, {"nuance": "DVG", "libelle": "Mignaloux-Beauvoir, Partageons l'Avenir", "tete": "Sophie KEMDJI", "color": "#888888"}, {"nuance": "LR", "libelle": "Pour vous, pour Mignaloux", "tete": "Ronan NEDELEC", "color": "#888888"}], "86|Montmorillon": [{"nuance": "DVC", "libelle": "MONTMORILLON, ECRIVONS L'AVENIR ENSEMBLE", "tete": "Juliette KOCHER", "color": "#888888"}, {"nuance": "DVD", "libelle": "UN NOUVEL ELAN POUR MONTMORILLON", "tete": "Jean-Luc SOUCHAUD", "color": "#888888"}, {"nuance": "DVG", "libelle": "TOUS ENSEMBLE POUR MONTMORILLON", "tete": "Christophe MARTIN", "color": "#888888"}], "86|Poitiers": [{"nuance": "DVC", "libelle": "Anthony BROTTIER Notre priorité, c'est vous !", "tete": "Anthony BROTTIER", "color": "#888888"}, {"nuance": "DVD", "libelle": "Liberté pour Poitiers", "tete": "Dolorès PROST", "color": "#888888"}, {"nuance": "EXG", "libelle": "Poitiers en Commun", "tete": "Bertrand GEAY", "color": "#888888"}, {"nuance": "EXG", "libelle": "Lutte ouvière - Le camp des travailleurs", "tete": "Ludovic GAILLARD", "color": "#888888"}, {"nuance": "PS", "libelle": "POITIERS AMBITIEUSE ET SOLIDAIRE", "tete": "François BLANCHARD", "color": "#888888"}, {"nuance": "RE", "libelle": "Un nouveau souffle pour Poitiers", "tete": "Lucile PARNAUDEAU", "color": "#888888"}, {"nuance": "RN", "libelle": "UN CIEL BLEU POUR POITIERS", "tete": "Charles RANGHEARD", "color": "#888888"}, {"nuance": "Écolo", "libelle": "Poitiers collectif", "tete": "Leonore MONCOND'HUY", "color": "#888888"}], "86|Saint-Savin": [], "86|Ternay": [], "87|Aixe-sur-Vienne": [{"nuance": "DVC", "libelle": "Aixe Avenir", "tete": "René ARNAUD", "color": "#888888"}, {"nuance": "DVG", "libelle": "ENSEMBLE POUR AIXE", "tete": "Gérard BRIOT", "color": "#888888"}], "87|Ambazac": [{"nuance": "DIV", "libelle": "AMBITIONS", "tete": "Bernard TROUBAT", "color": "#888888"}, {"nuance": "UG", "libelle": "AMBAZAC CONTINUONS ENSEMBLE", "tete": "Peggy BARIAT", "color": "#888888"}], "87|Bessines-sur-Gartempe": [], "87|Couzeix": [{"nuance": "DVC", "libelle": "BIEN VIVRE COUZEIX", "tete": "Jean-Claude PASTUREAU", "color": "#888888"}, {"nuance": "DVC", "libelle": "ENSEMBLE POUR COUZEIX", "tete": "Sébastien LARCHER", "color": "#888888"}, {"nuance": "UG", "libelle": "AGIR POUR COUZEIX - L'HUMAIN AU COEUR DE L'ACTION MUNICIPALE", "tete": "Laetitia NARDI", "color": "#888888"}], "87|Eymoutiers": [], "87|Feytiat": [{"nuance": "DVC", "libelle": "ENSEMBLE POUR FEYTIAT 2026", "tete": "Pascal BUSSIÈRE", "color": "#888888"}, {"nuance": "DVG", "libelle": "FEYTIAT, AVEC VOUS, UNIS ET ENGAGÉS POUR L'AVENIR", "tete": "Laurent LAFAYE", "color": "#888888"}], "87|Isle": [{"nuance": "DVC", "libelle": "ISLE ENSEMBLE", "tete": "Gilles BÉGOUT", "color": "#888888"}, {"nuance": "DVD", "libelle": "ISLE EN MIEUX", "tete": "Vincent REY", "color": "#888888"}], "87|Le Palais-sur-Vienne": [{"nuance": "UG", "libelle": "LE PALAIS, NOTRE AMBITION COMMUNE", "tete": "Ludovic GÉRAUDIE", "color": "#888888"}], "87|Limoges": [{"nuance": "DIV", "libelle": "Nouveau Printemps pour Limoges", "tete": "Marie DE FERLUC", "color": "#888888"}, {"nuance": "DVC", "libelle": "REUNIR LIMOGES", "tete": "Vincent LEONIE", "color": "#888888"}, {"nuance": "DVD", "libelle": "Avec Lombertie, soyons Fiers de Limoges", "tete": "Emile Roger LOMBERTIE", "color": "#888888"}, {"nuance": "DVD", "libelle": "LIMOGES EN PARTAGE", "tete": "Guillaume GUERIN", "color": "#888888"}, {"nuance": "DVG", "libelle": "Limoges Front Populaire - Union de la gauche sociale et écologiste", "tete": "Damien MAUDET", "color": "#888888"}, {"nuance": "EXG", "libelle": "LUTTE OUVRIERE - LE CAMPS DES TRAVAILLEURS", "tete": "Elisabeth FAUCON", "color": "#888888"}, {"nuance": "RN", "libelle": "LIMOGES EN GRAND", "tete": "Albin FREYCHET", "color": "#888888"}, {"nuance": "UG", "libelle": "POUR LIMOGES THIERRY MIGUEL", "tete": "Thierry MIGUEL", "color": "#888888"}], "87|Panazol": [{"nuance": "DVC", "libelle": "AGIR ENSEMBLE POUR PANAZOL", "tete": "Fabien DOUCET", "color": "#888888"}, {"nuance": "DVG", "libelle": "PANAZOL AUTREMENT", "tete": "Lysandre MERLIER", "color": "#888888"}], "87|Saint-Junien": [{"nuance": "DVG", "libelle": "Saint-Junien de toutes nos forces ! Ensemble, construisons l'avenir", "tete": "Yoann BALESTRAT", "color": "#888888"}, {"nuance": "UG", "libelle": "ENSEMBLE POUR SAINT-JUNIEN", "tete": "Hervé BEAUDET", "color": "#888888"}], "87|Saint-Léonard-de-Noblat": [{"nuance": "DVD", "libelle": "UN NOUVEL ÉLAN POUR SAINT-LÉONARD", "tete": "Xavier PIERRARD", "color": "#888888"}, {"nuance": "DVG", "libelle": "AVEC VOUS, CONTINUONS, POUR SAINT-LÉONARD", "tete": "Alain DARBON", "color": "#888888"}], "87|Saint-Yrieix-la-Perche": [{"nuance": "DVG", "libelle": "AGIR ENSEMBLE POUR SAINT-YRIEIX", "tete": "Laurent GORYL", "color": "#888888"}]};
const CR_LIST_INIT = [{"id": "16_Mathieu_Labrousse", "dept": "16", "nom": "Mathieu Labrousse", "groupe": "PS/PP", "commune": "Fléac", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "16_Thierry_Trijoulet", "dept": "16", "nom": "Thierry Trijoulet", "groupe": "PS/PP", "commune": "Mérignac", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "16_Patrice_Boutenègre", "dept": "16", "nom": "Patrice Boutenègre", "groupe": "PS/PP", "commune": "Saint-Adjutory", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "17_Richard_Guerit", "dept": "17", "nom": "Richard Guerit", "groupe": "RN", "commune": "Marennes-Hiers-Brouage", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "17_Rémi_Justinien", "dept": "17", "nom": "Rémi Justinien", "groupe": "PS/PP", "commune": "Tonnay-Charente", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "19_Françoise_Serre", "dept": "19", "nom": "Françoise Serre", "groupe": "PS/PP", "commune": "Chanteix", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "23_Étienne_Lejeune", "dept": "23", "nom": "Étienne Lejeune", "groupe": "PS/PP", "commune": "La Souterraine", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "24_Fanny_Castegnède", "dept": "24", "nom": "Fanny Castegnède", "groupe": "PCF", "commune": "Boulazac Isle Manoire", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "24_Christophe_Cathus", "dept": "24", "nom": "Christophe Cathus", "groupe": "PS/PP", "commune": "Calès", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "24_Jérôme_Peyrat", "dept": "24", "nom": "Jérôme Peyrat", "groupe": "Renaissance", "commune": "La Roque-Gageac", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "24_Maryline_Forgeneuf", "dept": "24", "nom": "Maryline Forgeneuf", "groupe": "Verts", "commune": "Saint-Estèphe", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "24_Benjamin_Delrieux", "dept": "24", "nom": "Benjamin Delrieux", "groupe": "PS/PP", "commune": "Siorac-en-Périgord", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "24_Colette_Langlade", "dept": "24", "nom": "Colette Langlade", "groupe": "PS/PP", "commune": "Thiviers", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "33_Yves_Foulon_(LR)\nLaurent_Lamara_(RN)\nVital_Baudé_(liste_DVG)", "dept": "33", "nom": "Yves Foulon (LR)\nLaurent Lamara (RN)\nVital Baudé (liste DVG)", "groupe": "Verts", "commune": "Arcachon", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "33_Damien_Obrador", "dept": "33", "nom": "Damien Obrador", "groupe": "RN", "commune": "Cabanac-et-Villagrains", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "33_Sandrine_Chadourne", "dept": "33", "nom": "Sandrine Chadourne", "groupe": "RN", "commune": "Castillon-la-Bataille", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "33_Christine_Seguineau", "dept": "33", "nom": "Christine Seguineau", "groupe": "Verts", "commune": "Eysines", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "33_Émilie_Sarrazin_(Verts)\nMarie-Laure_Cuvelier", "dept": "33", "nom": "Émilie Sarrazin (Verts)\nMarie-Laure Cuvelier", "groupe": "PS/PP", "commune": "Gradignan", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "33_Christophe_Duprat", "dept": "33", "nom": "Christophe Duprat", "groupe": "LR", "commune": "Saint-Aubin-de-Médoc", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "33_Frédérique_Joint", "dept": "33", "nom": "Frédérique Joint", "groupe": "RN", "commune": "Saint-Savin", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "40_Guillaume_Laussu", "dept": "40", "nom": "Guillaume Laussu", "groupe": "Centre & Indép.", "commune": "Dax", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "40_Pascale_Requenna", "dept": "40", "nom": "Pascale Requenna", "groupe": "Centre & Indép.", "commune": "Hagetmau", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "40_Serge_Sore", "dept": "40", "nom": "Serge Sore", "groupe": "PS/PP", "commune": "Luxey", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "40_Arnaud_Tauzin", "dept": "40", "nom": "Arnaud Tauzin", "groupe": "LR", "commune": "Saint-Sever", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "40_Frédérique_Charpenel", "dept": "40", "nom": "Frédérique Charpenel", "groupe": "PS/PP", "commune": "Soustons", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "47_Jean-Luc_Armand", "dept": "47", "nom": "Jean-Luc Armand", "groupe": "PRG", "commune": "Cocumont", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "47_Marie_Costes", "dept": "47", "nom": "Marie Costes", "groupe": "LR", "commune": "Saint-Front-sur-Lémance", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "64_Jean-Marie_Bergeret-Tercq", "dept": "64", "nom": "Jean-Marie Bergeret-Tercq", "groupe": "PS/PP", "commune": "Artix", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "64_Émilie_Dutoya", "dept": "64", "nom": "Émilie Dutoya", "groupe": "PS/PP", "commune": "Ciboure", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "64_Béatrice_Tariol", "dept": "64", "nom": "Béatrice Tariol", "groupe": "PCF", "commune": "Hendaye", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "64_Florent_Lacarrère", "dept": "64", "nom": "Florent Lacarrère", "groupe": "PS/PP", "commune": "Labatmale", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "64_Marc_Oxibar", "dept": "64", "nom": "Marc Oxibar", "groupe": "LR", "commune": "Ogeu-les-Bains", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "79_Nicolas_Gamache", "dept": "79", "nom": "Nicolas Gamache", "groupe": "Verts", "commune": "Les Châteliers", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "79_Pascal_Duforestelle", "dept": "79", "nom": "Pascal Duforestelle", "groupe": "PS/PP", "commune": "Magné", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "79_Guillaume_Riou", "dept": "79", "nom": "Guillaume Riou", "groupe": "PS/PP", "commune": "Marigny", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "79_Christelle_Chassagne", "dept": "79", "nom": "Christelle Chassagne", "groupe": "PS/PP", "commune": "Niort", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "86_Éric_Soulat", "dept": "86", "nom": "Éric Soulat", "groupe": "RN", "commune": "Archigny", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "86_Thierry_Perreau", "dept": "86", "nom": "Thierry Perreau", "groupe": "Verts", "commune": "Ternay", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "87_Andréa_Brouille", "dept": "87", "nom": "Andréa Brouille", "groupe": "PS/PP", "commune": "Bessines-sur-Gartempe", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}, {"id": "87_Mélanie_Plazanet", "dept": "87", "nom": "Mélanie Plazanet", "groupe": "PS/PP", "commune": "Eymoutiers", "mandat": "/", "perspective": "/", "statut": "Candidat", "s1": null, "s2": null}];

// ── Couleurs nuances ───────────────────────────────────────────────────────
const NUANCE_COLORS = {
  PS:"#C0392B",UG:"#922B21",DVG:"#E74C3C",PCF:"#7B241C",PRG:"#A93226",
  LFI:"#6C3483","Écolo":"#1E8449",EELV:"#1E8449",RN:"#003189",LR:"#2874A6",
  DVD:"#5D6D7E",DVC:"#1976D2",RE:"#EF6C00",UDI:"#0288D1",REC:"#0D0066",
  EXG:"#4A235A",NC:"#AAB7B8",DVG2:"#FF7043",DIV:"#9E9E9E",UD:"#1976D2",
  UXD:"#263238",UC:"#1565C0","MoDem":"#F57F17","Rég.":"#6A1B9A",
  Renaissance:"#EF6C00",Horizons:"#1565C0",
};
const NUANCE_TEXT = { NC:"#000000","MoDem":"#000000","Rég.":"#FFFFFF",DVC:"#FFFFFF",RE:"#FFFFFF",Renaissance:"#FFFFFF",Horizons:"#FFFFFF" };

const GROUPE_COLORS = {
  "PS/PP":"#C0392B",PS:"#C0392B",PP:"#C2185B",PCF:"#7B241C",PRG:"#A93226",
  LFI:"#6C3483","Écologistes":"#1E8449",EELV:"#1E8449","Les Verts":"#1E8449",
  DVG:"#E74C3C",RN:"#003189",LR:"#2874A6",DVD:"#5D6D7E","Centre/Indé":"#F39C12",
  UDI:"#0288D1",Modem:"#F57F17",Renaissance:"#EF6C00",RE:"#EF6C00",
};
const GROUPE_TEXT = { "Centre/Indé":"#000000",Modem:"#000000" };

const STATUT_COLORS = {
  "Victoire 1er Tour":           { bg:"#C8E6C9", text:"#1B5E20" },
  "Défaite 1er Tour":            { bg:"#FFEBEE", text:"#B71C1C" },
  "Qualifié·e pour le 2nd Tour": { bg:"#FFF3E0", text:"#E65100" },
  "Victoire 2nd Tour":           { bg:"#A5D6A7", text:"#1B5E20" },
  "Défaite 2nd Tour":            { bg:"#EF9A9A", text:"#C62828" },
};

const ENJEU_COLORS = {
  "très fort":{ bg:"#C0392B", text:"#fff" },
  "fort":     { bg:"#E67E22", text:"#fff" },
  "moyen":    { bg:"#F1C40F", text:"#000" },
  "faible":   { bg:"#27AE60", text:"#fff" },
};

const STATUTS_T1 = ["Victoire 1er Tour","Défaite 1er Tour","Qualifié·e pour le 2nd Tour"];
const STATUTS_T2 = ["Victoire 2nd Tour","Défaite 2nd Tour"];

const BLOCS = [
  { label:"PS / PP / PCF / PRG", groupes:["PS/PP","PS","PP","PCF","PRG"], color:"#C0392B" },
  { label:"DVG",                  groupes:["DVG"],                         color:"#E74C3C" },
  { label:"LFI",                  groupes:["LFI"],                         color:"#6C3483" },
  { label:"Écologistes / Verts",  groupes:["EELV","Les Verts","Écologistes","Écologiste"], color:"#1E8449" },
  { label:"Centre / UDI / Horizons", groupes:["Centre/Indé","UDI","Horizons","Modem","Renaissance","RE","DVC"], color:"#F39C12" },
  { label:"LR / DVD",             groupes:["LR","DVD"],                    color:"#2874A6" },
  { label:"RN / EXD",             groupes:["RN","EXD","UXD"],              color:"#003189" },
  { label:"Régionaliste",         groupes:["Rég."],                        color:"#6A1B9A" },
  { label:"Divers / NC",          groupes:["NC","DIV","SE"],               color:"#9E9E9E" },
];

// ── Composant principal ────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("communes");
  const [listeResults, setListeResults] = useState({});
  const [crList, setCrList] = useState(CR_LIST_INIT);
  const [searchQ, setSearchQ] = useState("");
  const [filterDept, setFilterDept] = useState("tous");
  const [filterEnjeu, setFilterEnjeu] = useState("tous");
  const [expandedCommune, setExpandedCommune] = useState(null);

  // Formulaire saisie T1
  const [formOpen, setFormOpen] = useState(null); // { comKey, listeIdx, tour }
  const [listeForm, setListeForm] = useState({ statut:"", score:"", voix:"" });

  // ── Chargement Supabase ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("resultats").select("*");
      if (error) { console.error("Erreur chargement:", error); return; }
      const obj = {};
      (data || []).forEach(row => {
        obj[row.result_key] = {
          statut_t1: row.statut_t1, score_t1: row.score_t1, voix_t1: row.voix_t1,
          statut_t2: row.statut_t2, score_t2: row.score_t2,
        };
      });
      setListeResults(obj);
      // Reporter vers crList
      setCrList(prev => reportCR(prev, obj));
    };
    load();
  }, []);

  // ── Report automatique CR ────────────────────────────────────────────────
  function reportCR(crArr, results) {
    return crArr.map(cr => {
      const com = COMMUNES.find(c => c.dept === cr.dept && c.nom === cr.commune);
      if (!com) return cr;
      const comKey = `${com.dept}|${com.nom}`;
      const listes = LISTES_DATA[comKey] || [];
      // Chercher liste PS/PP liée
      const PS_GROUPES = ["PS/PP","PS","PP","PCF","PRG"];
      let bestStatut = cr.statut === "Candidat" ? "Candidat" : cr.statut;
      let bestS1 = cr.s1; let bestS2 = cr.s2;
      listes.forEach((l, li) => {
        const rKey = `${comKey}|${li}`;
        const res = results[rKey] || {};
        // Correspondance: on prend le meilleur score PS/PP
        if (PS_GROUPES.includes(l.nuance) || PS_GROUPES.includes(cr.groupe)) {
          if (res.statut_t1) { bestStatut = res.statut_t1; bestS1 = res.score_t1 || null; }
          if (res.statut_t2) { bestStatut = res.statut_t2; bestS2 = res.score_t2 || null; }
        }
      });
      return { ...cr, statut: bestStatut, s1: bestS1, s2: bestS2 };
    });
  }

  // ── Sauvegarde T1 ────────────────────────────────────────────────────────
  const saveListeT1 = async () => {
    if (!formOpen) return;
    const { comKey, listeIdx } = formOpen;
    const key = `${comKey}|${listeIdx}`;
    const scoreNum = listeForm.score ? parseFloat(listeForm.score) : null;
    const voixNum  = listeForm.voix  ? parseFloat(listeForm.voix)  : null;
    const { error } = await supabase.from("resultats").upsert(
      { result_key: key, statut_t1: listeForm.statut, score_t1: scoreNum, voix_t1: voixNum },
      { onConflict: "result_key" }
    );
    if (error) { alert("Erreur sauvegarde: " + error.message); return; }
    const updated = {
      ...listeResults,
      [key]: { ...(listeResults[key]||{}), statut_t1: listeForm.statut, score_t1: scoreNum, voix_t1: voixNum }
    };
    setListeResults(updated);
    setCrList(prev => reportCR(prev, updated));
    setFormOpen(null);
    setListeForm({ statut:"", score:"", voix:"" });
  };

  // ── Sauvegarde T2 ────────────────────────────────────────────────────────
  const saveListeT2 = async () => {
    if (!formOpen) return;
    const { comKey, listeIdx } = formOpen;
    const key = `${comKey}|${listeIdx}`;
    const scoreNum = listeForm.score ? parseFloat(listeForm.score) : null;
    const { error } = await supabase.from("resultats").upsert(
      { result_key: key, statut_t2: listeForm.statut, score_t2: scoreNum },
      { onConflict: "result_key" }
    );
    if (error) { alert("Erreur sauvegarde: " + error.message); return; }
    const updated = {
      ...listeResults,
      [key]: { ...(listeResults[key]||{}), statut_t2: listeForm.statut, score_t2: scoreNum }
    };
    setListeResults(updated);
    setCrList(prev => reportCR(prev, updated));
    setFormOpen(null);
    setListeForm({ statut:"", score:"", voix:"" });
  };

  // ── Effacer résultat ─────────────────────────────────────────────────────
  const effacerListe = async (comKey, listeIdx) => {
    const key = `${comKey}|${listeIdx}`;
    const { error } = await supabase.from("resultats").delete().eq("result_key", key);
    if (error) { alert("Erreur suppression: " + error.message); return; }
    const updated = { ...listeResults };
    delete updated[key];
    setListeResults(updated);
    setCrList(prev => reportCR(prev, updated));
    setFormOpen(null);
  };

  // ── Export Excel ─────────────────────────────────────────────────────────
  const exportExcel = async () => {
    try {
      const payload = {
        depts: DEPTS,
        communes: COMMUNES,
        listes_data: LISTES_DATA,
        liste_results: listeResults,
        cr_list: crList,
      };
      const response = await fetch('/api/generate-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Erreur génération Excel');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toLocaleDateString('fr-FR').replace(/\//g,'-');
      a.href = url;
      a.download = `Municipales2026_NA_Resultats_${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Impossible de générer le fichier Excel : ' + err.message);
    }
  };

  // ── Export PDF ───────────────────────────────────────────────────────────
  const exportPDF = async () => {
    try {
      const stats = computeStats();
      const payload = {
        stats: { total: crList.length, cands: stats.candidats, e1: stats.v1t, e2: stats.v2t },
        blocs: computeBlocs(),
        depts: computeDepts(),
        communes: computeCommunesWithResults(),
        crs: crList,
        generatedAt: new Date().toISOString(),
        lastUpd: new Date().toLocaleDateString('fr-FR'),
      };
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Erreur PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Municipales2026_Note_${new Date().toLocaleDateString('fr-FR').replace(/\//g,'-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Impossible de générer le PDF : ' + err.message);
    }
  };

  // ── Calculs stats ─────────────────────────────────────────────────────────
  const computeStats = () => {
    const vals = Object.values(listeResults);
    const v1t = vals.filter(r => r.statut_t1 === "Victoire 1er Tour").length;
    const d1t = vals.filter(r => r.statut_t1 === "Défaite 1er Tour").length;
    const q2t = vals.filter(r => r.statut_t1 === "Qualifié·e pour le 2nd Tour").length;
    const v2t = vals.filter(r => r.statut_t2 === "Victoire 2nd Tour").length;
    const d2t = vals.filter(r => r.statut_t2 === "Défaite 2nd Tour").length;
    const candidats = crList.filter(cr => cr.statut === "Candidat").length;
    return { v1t, d1t, q2t, v2t, d2t, candidats };
  };

  const computeBlocs = () => BLOCS.map(b => {
    const crs = crList.filter(c => b.groupes.includes(c.groupe));
    return {
      bloc: b.label,
      engages: crs.length,
      victoires_1t: crs.filter(c=>c.statut==="Victoire 1er Tour").length,
      victoires_2t: crs.filter(c=>c.statut==="Victoire 2nd Tour").length,
      qualifies_2t: crs.filter(c=>c.statut==="Qualifié·e pour le 2nd Tour").length,
      defaites_1t: crs.filter(c=>c.statut==="Défaite 1er Tour").length,
      defaites_2t: crs.filter(c=>c.statut==="Défaite 2nd Tour").length,
    };
  });

  const computeDepts = () => DEPTS.map(dept => {
    const deptComs = COMMUNES.filter(c=>c.dept===dept.code);
    const deptCRs  = crList.filter(c=>c.dept===dept.code);
    let v1=0,v2=0,q=0,d=0;
    deptComs.forEach(com => {
      const comKey = `${com.dept}|${com.nom}`;
      const listes = LISTES_DATA[comKey]||[];
      listes.forEach((_,li) => {
        const res = listeResults[`${comKey}|${li}`]||{};
        if(res.statut_t1==="Victoire 1er Tour") v1++;
        if(res.statut_t2==="Victoire 2nd Tour") v2++;
        if(res.statut_t1==="Qualifié·e pour le 2nd Tour") q++;
        if(res.statut_t1==="Défaite 1er Tour"||res.statut_t2==="Défaite 2nd Tour") d++;
      });
    });
    const avecResultats = deptComs.filter(com => {
      const comKey=`${com.dept}|${com.nom}`;
      const listes=LISTES_DATA[comKey]||[];
      return listes.some((_,li)=>listeResults[`${comKey}|${li}`]?.statut_t1);
    }).length;
    return { dept:dept.code, departement:dept.nom, communes_suivies:deptComs.length,
      communes_avec_resultats:avecResultats, victoires_1t:v1, victoires_2t:v2,
      qualifies_2t:q, defaites:d, cr_engages:deptCRs.length };
  });

  const computeCommunesWithResults = () => {
    return COMMUNES.filter(com => {
      const comKey=`${com.dept}|${com.nom}`;
      const listes=LISTES_DATA[comKey]||[];
      return listes.some((_,li)=>listeResults[`${comKey}|${li}`]?.statut_t1);
    }).map(com => {
      const comKey=`${com.dept}|${com.nom}`;
      const listes=LISTES_DATA[comKey]||[];
      return { ...com, listes: listes.map((l,li)=>({ ...l, result: listeResults[`${comKey}|${li}`]||{} })) };
    });
  };

  // ── Filtrage communes ─────────────────────────────────────────────────────
  const communesFiltrees = useMemo(() => {
    let list = COMMUNES;
    if (filterDept !== "tous") list = list.filter(c => c.dept === filterDept);
    if (filterEnjeu !== "tous") list = list.filter(c => c.enjeu === filterEnjeu);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(c => c.nom.toLowerCase().includes(q) ||
        (LISTES_DATA[`${c.dept}|${c.nom}`]||[]).some(l => l.tete.toLowerCase().includes(q) || l.libelle.toLowerCase().includes(q)));
    }
    return list;
  }, [filterDept, filterEnjeu, searchQ]);

  const stats = computeStats();
  const lastUpd = new Date().toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit',year:'numeric'});

  // ── Styles communs ────────────────────────────────────────────────────────
  const S = {
    app: { fontFamily:"Arial,sans-serif", fontSize:11, background:"#F4F6F9", minHeight:"100vh" },
    header: { background:"#1A1A2E", color:"#fff", padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" },
    headerTitle: { fontSize:13, fontWeight:"bold", color:"#fff" },
    headerSub: { fontSize:9, color:"#aaa", marginTop:1 },
    nav: { background:"#2C3E50", display:"flex", gap:2, padding:"0 16px" },
    navBtn: (active) => ({ padding:"7px 14px", background:active?"#1A1A2E":"transparent", color:active?"#fff":"#ccc", border:"none", cursor:"pointer", fontSize:10, fontWeight:active?"bold":"normal", borderBottom:active?"2px solid #E74C3C":"2px solid transparent" }),
    card: { background:"#fff", borderRadius:4, padding:10, marginBottom:8, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" },
    badge: (bg, color="#fff") => ({ display:"inline-block", padding:"1px 5px", borderRadius:3, background:bg, color, fontSize:8, fontWeight:"bold" }),
    statBox: { background:"#fff", borderRadius:4, padding:"8px 12px", textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.08)" },
    btn: { padding:"4px 10px", borderRadius:3, border:"none", cursor:"pointer", fontSize:9, fontWeight:"bold" },
    input: { padding:"4px 6px", border:"1px solid #ddd", borderRadius:3, fontSize:10, width:"100%" },
    select: { padding:"4px 6px", border:"1px solid #ddd", borderRadius:3, fontSize:10 },
    overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" },
    modal: { background:"#fff", borderRadius:6, padding:16, width:300, maxWidth:"90vw" },
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>🗳 Municipales 2026 — Groupe Socialiste PP Nouvelle-Aquitaine</div>
          <div style={S.headerSub}>Suivi des résultats · MàJ {lastUpd}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button style={{...S.btn,background:"#27AE60",color:"#fff"}} onClick={exportExcel}>📊 Excel</button>
          <button style={{...S.btn,background:"#C0392B",color:"#fff"}} onClick={exportPDF}>📄 PDF</button>
        </div>
      </div>

      {/* Nav */}
      <div style={S.nav}>
        {[["communes","🏛 Communes Clés"],["tdb","📊 Tableau de Bord"],["crs","👥 Conseillers Rég."],["analyse","📈 Analyse par Bloc"]].map(([id,lbl])=>(
          <button key={id} style={S.navBtn(tab===id)} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{padding:12}}>
        {tab==="communes" && <TabCommunes {...{communesFiltrees, listeResults, filterDept, setFilterDept, filterEnjeu, setFilterEnjeu, searchQ, setSearchQ, expandedCommune, setExpandedCommune, formOpen, setFormOpen, listeForm, setListeForm, saveListeT1, saveListeT2, effacerListe, S}} />}
        {tab==="tdb" && <TabTableauDeBord {...{stats, listeResults, crList, S}} />}
        {tab==="crs" && <TabCRs {...{crList, setCrList, filterDept, setFilterDept, S}} />}
        {tab==="analyse" && <TabAnalyse {...{crList, listeResults, exportExcel, S}} />}
      </div>

      {/* Modal formulaire */}
      {formOpen && (
        <div style={S.overlay} onClick={()=>setFormOpen(null)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:"bold",marginBottom:10,fontSize:11}}>
              {formOpen.tour===2 ? "Saisir 2nd Tour" : "Saisir 1er Tour"} — {formOpen.comKey.split("|")[1]}
            </div>
            <div style={{marginBottom:6}}>
              <div style={{fontSize:9,marginBottom:2,color:"#666"}}>Statut *</div>
              <select style={{...S.select,width:"100%"}} value={listeForm.statut} onChange={e=>setListeForm(f=>({...f,statut:e.target.value}))}>
                <option value="">— choisir —</option>
                {(formOpen.tour===2 ? STATUTS_T2 : STATUTS_T1).map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            {formOpen.tour===1 && (
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,marginBottom:2,color:"#666"}}>Nb de voix</div>
                <input style={S.input} type="number" value={listeForm.voix} onChange={e=>setListeForm(f=>({...f,voix:e.target.value}))} placeholder="ex: 8200" />
              </div>
            )}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,marginBottom:2,color:"#666"}}>Score %</div>
              <input style={S.input} type="number" step="0.1" value={listeForm.score} onChange={e=>setListeForm(f=>({...f,score:e.target.value}))} placeholder="ex: 34.5" />
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
              <button style={{...S.btn,background:"#eee",color:"#333"}} onClick={()=>{effacerListe(formOpen.comKey,formOpen.listeIdx);}}>✕ Effacer</button>
              <div style={{display:"flex",gap:6}}>
                <button style={{...S.btn,background:"#eee",color:"#333"}} onClick={()=>setFormOpen(null)}>Annuler</button>
                <button style={{...S.btn,background:"#2874A6",color:"#fff"}} onClick={formOpen.tour===2 ? saveListeT2 : saveListeT1}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB : COMMUNES CLÉS
// ══════════════════════════════════════════════════════════════════════════════
function TabCommunes({ communesFiltrees, listeResults, filterDept, setFilterDept, filterEnjeu, setFilterEnjeu, searchQ, setSearchQ, expandedCommune, setExpandedCommune, formOpen, setFormOpen, listeForm, setListeForm, saveListeT1, saveListeT2, effacerListe, S }) {
  const NUANCE_COLORS = {
    PS:"#C0392B",UG:"#922B21",DVG:"#E74C3C",PCF:"#7B241C",PRG:"#A93226",
    LFI:"#6C3483","Écolo":"#1E8449",EELV:"#1E8449",RN:"#003189",LR:"#2874A6",
    DVD:"#5D6D7E",DVC:"#1976D2",RE:"#EF6C00",UDI:"#0288D1",REC:"#0D0066",
    EXG:"#4A235A",NC:"#AAB7B8",DVG2:"#FF7043",DIV:"#9E9E9E",UD:"#1976D2",
    UXD:"#263238",UC:"#1565C0","MoDem":"#F57F17","Rég.":"#6A1B9A",
    Renaissance:"#EF6C00",Horizons:"#1565C0",
  };
  const NUANCE_TEXT = { NC:"#000","MoDem":"#000" };
  const STATUT_COLORS = {
    "Victoire 1er Tour":{ bg:"#C8E6C9",text:"#1B5E20" },
    "Défaite 1er Tour":{ bg:"#FFEBEE",text:"#B71C1C" },
    "Qualifié·e pour le 2nd Tour":{ bg:"#FFF3E0",text:"#E65100" },
    "Victoire 2nd Tour":{ bg:"#A5D6A7",text:"#1B5E20" },
    "Défaite 2nd Tour":{ bg:"#EF9A9A",text:"#C62828" },
  };
  const ENJEU_COLORS = {
    "très fort":{ bg:"#C0392B",text:"#fff" },
    "fort":{ bg:"#E67E22",text:"#fff" },
    "moyen":{ bg:"#F1C40F",text:"#000" },
    "faible":{ bg:"#27AE60",text:"#fff" },
  };

  // Regrouper par département
  const byDept = {};
  communesFiltrees.forEach(com => {
    if (!byDept[com.dept]) byDept[com.dept] = [];
    byDept[com.dept].push(com);
  });

  const openForm = (com, listeIdx, tour) => {
    const comKey = `${com.dept}|${com.nom}`;
    const rKey = `${comKey}|${listeIdx}`;
    const res = listeResults[rKey] || {};
    if (tour === 1) {
      setListeForm({ statut: res.statut_t1||"", score: res.score_t1||"", voix: res.voix_t1||"" });
    } else {
      setListeForm({ statut: res.statut_t2||"", score: res.score_t2||"", voix: "" });
    }
    setFormOpen({ comKey, listeIdx, tour });
  };

  return (
    <div>
      {/* Filtres */}
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{...S.input,width:160}} placeholder="🔍 Commune, tête de liste..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} />
        <select style={S.select} value={filterDept} onChange={e=>setFilterDept(e.target.value)}>
          <option value="tous">Tous depts</option>
          {DEPTS.map(d=><option key={d.code} value={d.code}>{d.code} - {d.nom}</option>)}
        </select>
        <select style={S.select} value={filterEnjeu} onChange={e=>setFilterEnjeu(e.target.value)}>
          <option value="tous">Tous enjeux</option>
          {["très fort","fort","moyen","faible"].map(e=><option key={e} value={e}>{e}</option>)}
        </select>
        <span style={{fontSize:9,color:"#888"}}>{communesFiltrees.length} commune{communesFiltrees.length>1?"s":""}</span>
      </div>

      {/* Liste par département */}
      {DEPTS.map(dept => {
        const coms = (byDept[dept.code]||[]).sort((a,b)=>{
          const r={"très fort":0,"fort":1,"moyen":2,"faible":3};
          return (r[a.enjeu]??9)-(r[b.enjeu]??9);
        });
        if (!coms.length) return null;
        return (
          <div key={dept.code} style={{marginBottom:12}}>
            {/* Titre département */}
            <div style={{background:"#2C3E50",color:"#fff",padding:"5px 10px",borderRadius:"3px 3px 0 0",fontSize:10,fontWeight:"bold"}}>
              ▶ {dept.nom} ({dept.code})
            </div>
            <div style={{border:"1px solid #ddd",borderTop:"none",borderRadius:"0 0 3px 3px",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
                <thead>
                  <tr style={{background:"#1A1A2E",color:"#fff"}}>
                    <th style={{padding:"5px 6px",textAlign:"left",width:120}}>Commune</th>
                    <th style={{padding:"5px 6px",textAlign:"left",width:60}}>Enjeu</th>
                    <th style={{padding:"5px 6px",textAlign:"left",width:60}}>CR liés</th>
                    <th style={{padding:"5px 6px",textAlign:"left"}}>Liste</th>
                    <th style={{padding:"5px 6px",width:50}}>Nuance</th>
                    <th style={{padding:"5px 6px",textAlign:"left",width:120}}>Tête de liste</th>
                    <th style={{padding:"5px 6px",textAlign:"center",width:120}}>Statut 1T</th>
                    <th style={{padding:"5px 6px",textAlign:"center",width:50}}>Score 1T</th>
                    <th style={{padding:"5px 6px",textAlign:"center",width:120}}>Statut 2T</th>
                    <th style={{padding:"5px 6px",textAlign:"center",width:50}}>Score 2T</th>
                    <th style={{padding:"5px 6px",width:90}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coms.map((com, ci) => {
                    const comKey = `${com.dept}|${com.nom}`;
                    const listes = LISTES_DATA[comKey] || [];
                    const crNoms = (com.cr_lies||[]).map(cr=>`${cr.nom} (${cr.groupe})`).join(", ");
                    const enjeuC = ENJEU_COLORS[com.enjeu] || {};
                    return listes.length === 0 ? (
                      <tr key={comKey} style={{background:ci%2===0?"#F8F9FA":"#fff"}}>
                        <td style={{padding:"4px 6px",fontWeight:"bold"}}>{com.nom}</td>
                        <td style={{padding:"4px 6px"}}>{com.enjeu && <span style={{...S.badge(enjeuC.bg||"#888",enjeuC.text||"#fff")}}>{com.enjeu}</span>}</td>
                        <td colSpan={9} style={{padding:"4px 6px",color:"#aaa",fontStyle:"italic"}}>Aucune liste enregistrée</td>
                      </tr>
                    ) : listes.map((l, li) => {
                      const rKey = `${comKey}|${li}`;
                      const res = listeResults[rKey] || {};
                      const st1 = res.statut_t1 || "";
                      const sc1 = res.score_t1;
                      const st2 = res.statut_t2 || "";
                      const sc2 = res.score_t2;
                      const sc1C = STATUT_COLORS[st1] || {};
                      const sc2C = STATUT_COLORS[st2] || {};
                      const nc = NUANCE_COLORS[l.nuance] || "#888";
                      const nf = NUANCE_TEXT[l.nuance] || "#fff";
                      const bg = ci%2===0?"#F8F9FA":"#fff";
                      const isQualifie = st1 === "Qualifié·e pour le 2nd Tour";
                      return (
                        <tr key={rKey} style={{background:bg, borderTop: li===0 && ci>0 ? "1px solid #eee" : "none"}}>
                          {li===0 ? (
                            <>
                              <td style={{padding:"4px 6px",fontWeight:"bold",verticalAlign:"top"}}>{com.nom}</td>
                              <td style={{padding:"4px 6px",verticalAlign:"top"}}>{com.enjeu && <span style={{...S.badge(enjeuC.bg||"#888",enjeuC.text||"#fff")}}>{com.enjeu}</span>}</td>
                              <td style={{padding:"4px 6px",color:"#1A5276",background:"#EBF5FB",fontSize:8,verticalAlign:"top"}}>{crNoms}</td>
                            </>
                          ) : (
                            <><td style={{background:bg}}/><td style={{background:bg}}/><td style={{padding:"4px 6px",color:"#1A5276",background:"#EBF5FB",fontSize:8}}/></>
                          )}
                          <td style={{padding:"4px 6px"}}>{l.libelle}</td>
                          <td style={{padding:"4px 6px",textAlign:"center"}}><span style={{...S.badge(nc,nf)}}>{l.nuance}</span></td>
                          <td style={{padding:"4px 6px"}}>{l.tete}</td>
                          <td style={{padding:"4px 6px",textAlign:"center"}}>{st1 && <span style={{...S.badge(sc1C.bg,sc1C.text)}}>{st1}</span>}</td>
                          <td style={{padding:"4px 6px",textAlign:"center"}}>{sc1!=null?`${sc1}%`:""}</td>
                          <td style={{padding:"4px 6px",textAlign:"center"}}>{st2 && <span style={{...S.badge(sc2C.bg,sc2C.text)}}>{st2}</span>}</td>
                          <td style={{padding:"4px 6px",textAlign:"center"}}>{sc2!=null?`${sc2}%`:""}</td>
                          <td style={{padding:"4px 6px",textAlign:"center"}}>
                            <div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap"}}>
                              <button style={{...S.btn,background:"#2874A6",color:"#fff",padding:"2px 6px",fontSize:8}} onClick={()=>openForm(com,li,1)}>1T</button>
                              {isQualifie && <button style={{...S.btn,background:"#E65100",color:"#fff",padding:"2px 6px",fontSize:8}} onClick={()=>openForm(com,li,2)}>2T</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB : TABLEAU DE BORD
// ══════════════════════════════════════════════════════════════════════════════
function TabTableauDeBord({ stats, listeResults, crList, S }) {
  const STATUT_COLORS = {
    "Victoire 1er Tour":{ bg:"#C8E6C9",text:"#1B5E20" },
    "Défaite 1er Tour":{ bg:"#FFEBEE",text:"#B71C1C" },
    "Qualifié·e pour le 2nd Tour":{ bg:"#FFF3E0",text:"#E65100" },
    "Victoire 2nd Tour":{ bg:"#A5D6A7",text:"#1B5E20" },
    "Défaite 2nd Tour":{ bg:"#EF9A9A",text:"#C62828" },
    "Candidat":{ bg:"#E3F2FD",text:"#1565C0" },
    "Non-candidat":{ bg:"#F5F5F5",text:"#757575" },
  };

  const statCards = [
    { label:"Total CR suivis", val:crList.length, bg:"#1A1A2E", color:"#fff" },
    { label:"Candidats", val:stats.candidats, bg:"#1565C0", color:"#fff" },
    { label:"Victoires 1er Tour", val:stats.v1t, bg:"#1B5E20", color:"#fff" },
    { label:"Qualifiés 2nd Tour", val:stats.q2t, bg:"#E65100", color:"#fff" },
    { label:"Défaites 1er Tour", val:stats.d1t, bg:"#B71C1C", color:"#fff" },
    { label:"Victoires 2nd Tour", val:stats.v2t, bg:"#27AE60", color:"#fff" },
    { label:"Défaites 2nd Tour", val:stats.d2t, bg:"#C62828", color:"#fff" },
  ];

  // Stats par département
  const byDept = {};
  crList.forEach(cr => {
    if (!byDept[cr.dept]) byDept[cr.dept] = [];
    byDept[cr.dept].push(cr);
  });

  return (
    <div>
      {/* Cartes stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8,marginBottom:12}}>
        {statCards.map(c=>(
          <div key={c.label} style={{...S.statBox,background:c.bg,color:c.color}}>
            <div style={{fontSize:22,fontWeight:"bold"}}>{c.val}</div>
            <div style={{fontSize:9,marginTop:2,opacity:0.9}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tableau CR par département */}
      {DEPTS.map(dept => {
        const crs = (byDept[dept.code]||[]);
        if (!crs.length) return null;
        return (
          <div key={dept.code} style={{marginBottom:10}}>
            <div style={{background:"#2C3E50",color:"#fff",padding:"4px 10px",borderRadius:"3px 3px 0 0",fontSize:10,fontWeight:"bold"}}>
              {dept.nom} ({dept.code}) — {crs.length} CR
            </div>
            <div style={{border:"1px solid #ddd",borderTop:"none",borderRadius:"0 0 3px 3px",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
                <thead>
                  <tr style={{background:"#1A1A2E",color:"#fff"}}>
                    <th style={{padding:"4px 6px",textAlign:"left"}}>Nom</th>
                    <th style={{padding:"4px 6px",textAlign:"left"}}>Groupe</th>
                    <th style={{padding:"4px 6px",textAlign:"left"}}>Commune</th>
                    <th style={{padding:"4px 6px",textAlign:"left"}}>Mandat</th>
                    <th style={{padding:"4px 6px",textAlign:"left"}}>Perspectives</th>
                    <th style={{padding:"4px 6px",textAlign:"center"}}>Statut</th>
                    <th style={{padding:"4px 6px",textAlign:"center"}}>Score 1T</th>
                    <th style={{padding:"4px 6px",textAlign:"center"}}>Score 2T</th>
                  </tr>
                </thead>
                <tbody>
                  {crs.map((cr,ri)=>{
                    const sc = STATUT_COLORS[cr.statut]||{};
                    const gc = { "PS/PP":"#C0392B",PS:"#C0392B",PP:"#C2185B",PCF:"#7B241C",PRG:"#A93226",LFI:"#6C3483","Écologistes":"#1E8449",DVG:"#E74C3C",RN:"#003189",LR:"#2874A6",DVD:"#5D6D7E","Centre/Indé":"#F39C12" };
                    const gt = { "Centre/Indé":"#000" };
                    const gbg = gc[cr.groupe]||"#888";
                    const gfg = gt[cr.groupe]||"#fff";
                    return (
                      <tr key={cr.id} style={{background:ri%2===0?"#F8F9FA":"#fff"}}>
                        <td style={{padding:"4px 6px",fontWeight:"bold"}}>{cr.nom}</td>
                        <td style={{padding:"4px 6px"}}><span style={{...S.badge(gbg,gfg)}}>{cr.groupe}</span></td>
                        <td style={{padding:"4px 6px"}}>{cr.commune!=="/"?cr.commune:""}</td>
                        <td style={{padding:"4px 6px"}}>{cr.mandat!=="/"?cr.mandat:""}</td>
                        <td style={{padding:"4px 6px"}}>{cr.perspective!=="/"?cr.perspective:""}</td>
                        <td style={{padding:"4px 6px",textAlign:"center"}}>{cr.statut&&<span style={{...S.badge(sc.bg||"#eee",sc.text||"#333")}}>{cr.statut}</span>}</td>
                        <td style={{padding:"4px 6px",textAlign:"center"}}>{cr.s1!=null?`${cr.s1}%`:""}</td>
                        <td style={{padding:"4px 6px",textAlign:"center"}}>{cr.s2!=null?`${cr.s2}%`:""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB : CONSEILLERS RÉGIONAUX
// ══════════════════════════════════════════════════════════════════════════════
function TabCRs({ crList, setCrList, filterDept, setFilterDept, S }) {
  const [editCR, setEditCR] = useState(null);
  const [crForm, setCRForm] = useState({});

  const STATUTS_CR = ["Candidat","Non-candidat","Victoire 1er Tour","Qualifié·e pour le 2nd Tour","Défaite 1er Tour","Victoire 2nd Tour","Défaite 2nd Tour"];
  const GROUPES_CR = ["PS/PP","PS","PP","PCF","PRG","DVG","LFI","Écologistes","RN","LR","DVD","Centre/Indé","UDI","Modem","Renaissance"];

  const STATUT_COLORS = {
    "Victoire 1er Tour":{ bg:"#C8E6C9",text:"#1B5E20" },
    "Défaite 1er Tour":{ bg:"#FFEBEE",text:"#B71C1C" },
    "Qualifié·e pour le 2nd Tour":{ bg:"#FFF3E0",text:"#E65100" },
    "Victoire 2nd Tour":{ bg:"#A5D6A7",text:"#1B5E20" },
    "Défaite 2nd Tour":{ bg:"#EF9A9A",text:"#C62828" },
    "Candidat":{ bg:"#E3F2FD",text:"#1565C0" },
    "Non-candidat":{ bg:"#F5F5F5",text:"#757575" },
  };

  const saveCR = () => {
    setCrList(prev => prev.map(cr => cr.id===editCR.id ? { ...cr, ...crForm } : cr));
    setEditCR(null);
  };

  const crsFiltered = filterDept==="tous" ? crList : crList.filter(c=>c.dept===filterDept);
  const byDept = {};
  crsFiltered.forEach(cr => { if(!byDept[cr.dept]) byDept[cr.dept]=[]; byDept[cr.dept].push(cr); });

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
        <select style={S.select} value={filterDept} onChange={e=>setFilterDept(e.target.value)}>
          <option value="tous">Tous départements</option>
          {DEPTS.map(d=><option key={d.code} value={d.code}>{d.code} - {d.nom}</option>)}
        </select>
        <span style={{fontSize:9,color:"#888"}}>{crsFiltered.length} CR</span>
      </div>

      {DEPTS.map(dept => {
        const crs = byDept[dept.code]||[];
        if (!crs.length) return null;
        return (
          <div key={dept.code} style={{marginBottom:10}}>
            <div style={{background:"#2C3E50",color:"#fff",padding:"4px 10px",borderRadius:"3px 3px 0 0",fontSize:10,fontWeight:"bold"}}>
              {dept.nom} ({dept.code})
            </div>
            <div style={{border:"1px solid #ddd",borderTop:"none",borderRadius:"0 0 3px 3px",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
                <thead>
                  <tr style={{background:"#1A1A2E",color:"#fff"}}>
                    <th style={{padding:"4px 6px",textAlign:"left"}}>Nom</th>
                    <th style={{padding:"4px 6px",textAlign:"left"}}>Groupe</th>
                    <th style={{padding:"4px 6px",textAlign:"left"}}>Commune</th>
                    <th style={{padding:"4px 6px",textAlign:"left"}}>Mandat</th>
                    <th style={{padding:"4px 6px",textAlign:"left"}}>Perspectives</th>
                    <th style={{padding:"4px 6px",textAlign:"center"}}>Statut</th>
                    <th style={{padding:"4px 6px",textAlign:"center"}}>1T%</th>
                    <th style={{padding:"4px 6px",textAlign:"center"}}>2T%</th>
                    <th style={{padding:"4px 6px",width:60}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {crs.map((cr,ri)=>{
                    const sc = STATUT_COLORS[cr.statut]||{};
                    const gc = { "PS/PP":"#C0392B",PS:"#C0392B",PP:"#C2185B",PCF:"#7B241C",PRG:"#A93226",LFI:"#6C3483","Écologistes":"#1E8449",DVG:"#E74C3C",RN:"#003189",LR:"#2874A6",DVD:"#5D6D7E","Centre/Indé":"#F39C12" };
                    const gt = { "Centre/Indé":"#000" };
                    return (
                      <tr key={cr.id} style={{background:ri%2===0?"#F8F9FA":"#fff"}}>
                        <td style={{padding:"4px 6px",fontWeight:"bold"}}>{cr.nom}</td>
                        <td style={{padding:"4px 6px"}}><span style={{...S.badge(gc[cr.groupe]||"#888",gt[cr.groupe]||"#fff")}}>{cr.groupe}</span></td>
                        <td style={{padding:"4px 6px"}}>{cr.commune!=="/"?cr.commune:""}</td>
                        <td style={{padding:"4px 6px"}}>{cr.mandat!=="/"?cr.mandat:""}</td>
                        <td style={{padding:"4px 6px"}}>{cr.perspective!=="/"?cr.perspective:""}</td>
                        <td style={{padding:"4px 6px",textAlign:"center"}}>{cr.statut&&<span style={{...S.badge(sc.bg||"#eee",sc.text||"#333")}}>{cr.statut}</span>}</td>
                        <td style={{padding:"4px 6px",textAlign:"center"}}>{cr.s1!=null?`${cr.s1}%`:""}</td>
                        <td style={{padding:"4px 6px",textAlign:"center"}}>{cr.s2!=null?`${cr.s2}%`:""}</td>
                        <td style={{padding:"4px 6px",textAlign:"center"}}>
                          <button style={{...S.btn,background:"#2874A6",color:"#fff",padding:"2px 6px",fontSize:8}} onClick={()=>{setEditCR(cr);setCRForm({statut:cr.statut,mandat:cr.mandat||"",perspective:cr.perspective||"",s1:cr.s1||"",s2:cr.s2||""});}}>Éditer</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Modal édition CR */}
      {editCR && (
        <div style={S.overlay} onClick={()=>setEditCR(null)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:"bold",marginBottom:10,fontSize:11}}>Éditer — {editCR.nom}</div>
            {[["Statut","statut",STATUTS_CR],["Mandat","mandat",null],["Perspectives","perspective",null]].map(([lbl,key,opts])=>(
              <div key={key} style={{marginBottom:6}}>
                <div style={{fontSize:9,marginBottom:2,color:"#666"}}>{lbl}</div>
                {opts ? (
                  <select style={{...S.select,width:"100%"}} value={crForm[key]||""} onChange={e=>setCRForm(f=>({...f,[key]:e.target.value}))}>
                    <option value="">—</option>
                    {opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input style={S.input} value={crForm[key]||""} onChange={e=>setCRForm(f=>({...f,[key]:e.target.value}))} />
                )}
              </div>
            ))}
            <div style={{display:"flex",gap:6,marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:9,marginBottom:2,color:"#666"}}>Score 1T%</div>
                <input style={S.input} type="number" step="0.1" value={crForm.s1||""} onChange={e=>setCRForm(f=>({...f,s1:e.target.value}))} />
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,marginBottom:2,color:"#666"}}>Score 2T%</div>
                <input style={S.input} type="number" step="0.1" value={crForm.s2||""} onChange={e=>setCRForm(f=>({...f,s2:e.target.value}))} />
              </div>
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
              <button style={{...S.btn,background:"#eee",color:"#333"}} onClick={()=>setEditCR(null)}>Annuler</button>
              <button style={{...S.btn,background:"#2874A6",color:"#fff"}} onClick={saveCR}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB : ANALYSE PAR BLOC
// ══════════════════════════════════════════════════════════════════════════════
function TabAnalyse({ crList, listeResults, exportExcel, S }) {
  const BLOCS = [
    { label:"PS / PP / PCF / PRG", groupes:["PS/PP","PS","PP","PCF","PRG"], color:"#C0392B" },
    { label:"DVG",                  groupes:["DVG"],                         color:"#E74C3C" },
    { label:"LFI",                  groupes:["LFI"],                         color:"#6C3483" },
    { label:"Écologistes / Verts",  groupes:["EELV","Les Verts","Écologistes","Écologiste"], color:"#1E8449" },
    { label:"Centre / UDI / Horizons", groupes:["Centre/Indé","UDI","Horizons","Modem","Renaissance","RE","DVC"], color:"#F39C12" },
    { label:"LR / DVD",             groupes:["LR","DVD"],                    color:"#2874A6" },
    { label:"RN / EXD",             groupes:["RN","EXD","UXD"],              color:"#003189" },
    { label:"Régionaliste",         groupes:["Rég."],                        color:"#6A1B9A" },
    { label:"Divers / NC",          groupes:["NC","DIV","SE"],               color:"#9E9E9E" },
  ];

  const cols = ["CR engagés","Victoires 1T","Qualifiés 2T","Défaites 1T","Victoires 2T","Défaites 2T","En attente"];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
        <button style={{...S.btn,background:"#27AE60",color:"#fff"}} onClick={exportExcel}>📊 Exporter Excel complet</button>
      </div>
      <div style={{...S.card,padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
          <thead>
            <tr style={{background:"#1A1A2E",color:"#fff"}}>
              <th style={{padding:"6px 10px",textAlign:"left",width:200}}>Bloc politique</th>
              {cols.map(c=><th key={c} style={{padding:"6px 8px",textAlign:"center"}}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {BLOCS.map((b,bi)=>{
              const crs = crList.filter(c=>b.groupes.includes(c.groupe));
              const v1 = crs.filter(c=>c.statut==="Victoire 1er Tour").length;
              const v2 = crs.filter(c=>c.statut==="Victoire 2nd Tour").length;
              const q  = crs.filter(c=>c.statut==="Qualifié·e pour le 2nd Tour").length;
              const d1 = crs.filter(c=>c.statut==="Défaite 1er Tour").length;
              const d2 = crs.filter(c=>c.statut==="Défaite 2nd Tour").length;
              const att= crs.filter(c=>c.statut==="Candidat"||c.statut==="Non-candidat").length;
              const bg = bi%2===0?"#F8F9FA":"#fff";
              return (
                <tr key={b.label} style={{background:bg}}>
                  <td style={{padding:"5px 10px"}}>
                    <span style={{...S.badge(b.color,b.color==="#F39C12"?"#000":"#fff"),marginRight:6}}>{b.label}</span>
                  </td>
                  {[crs.length,v1,q,d1,v2,d2,att].map((v,vi)=>(
                    <td key={vi} style={{padding:"5px 8px",textAlign:"center",fontWeight:vi===0?"bold":"normal"}}>{v||0}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Synthèse par département */}
      <div style={{marginTop:12}}>
        <div style={{fontWeight:"bold",fontSize:11,marginBottom:6,color:"#1A1A2E"}}>Synthèse par département</div>
        <div style={{...S.card,padding:0,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
            <thead>
              <tr style={{background:"#1A1A2E",color:"#fff"}}>
                <th style={{padding:"5px 8px",textAlign:"left"}}>Département</th>
                <th style={{padding:"5px 8px",textAlign:"center"}}>Communes clés</th>
                <th style={{padding:"5px 8px",textAlign:"center"}}>Saisies</th>
                <th style={{padding:"5px 8px",textAlign:"center"}}>Victoires 1T</th>
                <th style={{padding:"5px 8px",textAlign:"center"}}>Qualifiés 2T</th>
                <th style={{padding:"5px 8px",textAlign:"center"}}>Défaites 1T</th>
                <th style={{padding:"5px 8px",textAlign:"center"}}>Victoires 2T</th>
                <th style={{padding:"5px 8px",textAlign:"center"}}>Défaites 2T</th>
                <th style={{padding:"5px 8px",textAlign:"center"}}>CR PS/PP</th>
              </tr>
            </thead>
            <tbody>
              {DEPTS.map((dept,di)=>{
                const deptComs = COMMUNES.filter(c=>c.dept===dept.code);
                let v1=0,v2=0,q=0,d1=0,d2=0,saisies=0;
                deptComs.forEach(com=>{
                  const comKey=`${com.dept}|${com.nom}`;
                  const listes=LISTES_DATA[comKey]||[];
                  listes.forEach((_,li)=>{
                    const res=listeResults[`${comKey}|${li}`]||{};
                    if(res.statut_t1){saisies++;}
                    if(res.statut_t1==="Victoire 1er Tour") v1++;
                    if(res.statut_t2==="Victoire 2nd Tour") v2++;
                    if(res.statut_t1==="Qualifié·e pour le 2nd Tour") q++;
                    if(res.statut_t1==="Défaite 1er Tour") d1++;
                    if(res.statut_t2==="Défaite 2nd Tour") d2++;
                  });
                });
                const crPspp = crList.filter(c=>c.dept===dept.code && ["PS/PP","PS","PP","PCF","PRG"].includes(c.groupe));
                const bg=di%2===0?"#F8F9FA":"#fff";
                return (
                  <tr key={dept.code} style={{background:bg}}>
                    <td style={{padding:"4px 8px",fontWeight:"bold"}}>{dept.nom} ({dept.code})</td>
                    <td style={{padding:"4px 8px",textAlign:"center"}}>{deptComs.length}</td>
                    <td style={{padding:"4px 8px",textAlign:"center"}}>{saisies}</td>
                    <td style={{padding:"4px 8px",textAlign:"center",color:v1?"#1B5E20":"#999"}}>{v1||"-"}</td>
                    <td style={{padding:"4px 8px",textAlign:"center",color:q?"#E65100":"#999"}}>{q||"-"}</td>
                    <td style={{padding:"4px 8px",textAlign:"center",color:d1?"#B71C1C":"#999"}}>{d1||"-"}</td>
                    <td style={{padding:"4px 8px",textAlign:"center",color:v2?"#1B5E20":"#999"}}>{v2||"-"}</td>
                    <td style={{padding:"4px 8px",textAlign:"center",color:d2?"#C62828":"#999"}}>{d2||"-"}</td>
                    <td style={{padding:"4px 8px",textAlign:"center"}}>{crPspp.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
