export const initialData = {
  total_credits: 60,
  blocks: [
    {
      name: 'Bloc Algorithmique & Programmation (171BC01)',
      credit: 19,
      modules: [
        {
          name: 'Introduction à la programmation (171UD02)',
          credit: 5,
          evaluations: {
            CT: { grade: null, coef: 1 },
            TP: { grade: null, coef: 2 },
          },
        },
        {
          name: 'Langage C (171UD08)',
          credit: 9,
          evaluations: {
            CC1_S1: { grade: null, coef: 1 },
            CC2_S1: { grade: null, coef: 1 },
            CT_S2: { grade: null, coef: 2 },
          },
        },
        {
          name: 'Algorithmique 1 (172UD02)',
          credit: 5,
          evaluations: {
            CC: { grade: null, coef: 1.5 },
            TP: { grade: null, coef: 1.5 },
            CT: { grade: null, coef: 2 },
          },
        },
      ],
    },
    {
      name: 'Bloc Systèmes & Architecture (171BC02)',
      credit: 14,
      modules: [
        {
          name: 'Architecture des ordinateurs (171UD04)',
          credit: 6,
          evaluations: {
            CC1: { grade: null, coef: 1 },
            TP: { grade: null, coef: 1 },
            CT: { grade: null, coef: 1 },
          },
        },
        {
          name: 'Unix et programmation shell (171UD15)',
          credit: 5,
          evaluations: {
            UNIX_CC1_S1: { grade: null, coef: 1 },
            UNIX_CC2_S1: { grade: null, coef: 1 },
            UNIX_CC3_S1: { grade: null, coef: 1 },
            Shell_CC1_S2: { grade: null, coef: 1 },
            Shell_CC2_S2: { grade: null, coef: 1 },
            Shell_CC3_S2: { grade: null, coef: 1 },
          },
        },
        {
          name: "Réseau d'Objets connectés (172UD07)",
          credit: 3,
          evaluations: {
            CT: { grade: null, coef: 1 },
          },
        },
      ],
    },
    {
      name: 'Bloc Web (171BC03)',
      credit: 8,
      modules: [
        {
          name: 'Web statique (171UD06)',
          credit: 2.5,
          evaluations: {
            CT: { grade: null, coef: 2 },
            TP: { grade: null, coef: 1 },
          },
        },
        {
          name: 'Algèbre et modèles relationnels (172UD04)',
          credit: 3,
          evaluations: {
            CC1: { grade: null, coef: 1 },
            CC2: { grade: null, coef: 2 },
          },
        },
        {
          name: 'Web et stratégies digitales (172UD09)',
          credit: 2.5,
          evaluations: {
            CC1: { grade: null, coef: 1 },
            TP: { grade: null, coef: 1.5 },
          },
        },
      ],
    },
    {
      name: 'Bloc Maths (171BC04)',
      credit: 8,
      modules: [
        {
          name: 'Analyse & Algèbre 1 (171UD11)',
          credit: 4,
          evaluations: {
            CC1: { grade: null, coef: 1.5 },
            CT: { grade: null, coef: 2.5 },
          },
        },
        {
          name: 'Statistiques et Probabilités 1 (172UD12)',
          credit: 4,
          evaluations: {
            CI: { grade: null, coef: 1.5 },
            CT: { grade: null, coef: 2.5 },
          },
        },
      ],
    },
    {
      name: 'Bloc Pré-professionnel et linguistique (171BC05)',
      credit: 11,
      modules: [
        {
          name: 'Anglais (171UL02)',
          credit: 4,
          evaluations: {
            S1_Oral: { grade: null, coef: 1 },
            S1_Ecrit: { grade: null, coef: 1 },
            S2_Oral: { grade: null, coef: 1 },
            S2_Ecrit: { grade: null, coef: 1 },
          },
        },
        {
          name: 'Culture et compétences numériques - PIX (171UT03)',
          credit: 2,
          evaluations: {
            'QCM_compétences': { grade: null, coef: 0.2 },
            Positionnement_PIX: { grade: 'null/800', coef: 0.2 },
            Certification_PIX: { grade: 'null/800', coef: 0.6 },
          },
        },
        {
          name: 'Écrire pour communiquer (171UT05)',
          credit: 3,
          evaluations: {
            S1_1_campagne: { grade: null, coef: 1 },
            S1_2campagne: { grade: null, coef: 1 },
            S1_3_campagnes: { grade: null, coef: 1 },
            S2_CC1: { grade: null, coef: 1.5 },
            S2_CC2: { grade: null, coef: 1.5 },
          },
        },
        {
          name: 'Projet Personnel & Professionnel (172UP03)',
          credit: 2,
          evaluations: {
            CC: { grade: null, coef: 1 },
          },
        },
      ],
    },
  ],
}
