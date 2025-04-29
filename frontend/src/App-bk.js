import WormCatReport from './components/WormCatReport';

const someUiData = {
  dir: 'example_dir',
  cat1_apv: [
    { Category: "Stress response", RGS: 104, AC: 833, PValue: 1.72200864736962e-35, Bonferroni: 5.16602594210886e-34 },
    { Category: "Transcription factor", RGS: 45, AC: 581, PValue: 3.17608005428479e-10, Bonferroni: 9.52824016285437e-09 },
    { Category: "Proteolysis proteasome", RGS: 48, AC: 733, PValue: 1.29156842803213e-08, Bonferroni: 3.87470528409639e-07 },
    { Category: "Metabolism", RGS: 72, AC: 1601, PValue: 5.95239172448214e-06, Bonferroni: 0.000178571751734464 },
    { Category: "Transmembrane transport", RGS: 44, AC: 901, PValue: 5.31824391271368e-05, Bonferroni: 0.0015954731738141 }

  ],
  cat2_apv: [
    { Category: "Stress response: pathogen", RGS: 43, AC: 192, PValue: 1.64510510484481e-24, Bonferroni: 1.85896876847464e-22 },
    { Category: "Proteolysis proteasome: E3", RGS: 47, AC: 590, PValue: 5.70652548167779e-11, Bonferroni: 6.4483737942959e-09 },
    { Category: "Metabolism: lipid", RGS: 41, AC: 526, PValue: 1.51128211503949e-09, Bonferroni: 1.70774878999462e-07 },
    { Category: "Stress response: detoxification", RGS: 21, AC: 206, PValue: 2.34370442271433e-07, Bonferroni: 2.64838599766719e-05 },
    { Category: "Transcription factor: NHR", RGS: 22, AC: 259, PValue: 2.06528889221412e-06, Bonferroni: 0.000233377644820196 },
    { Category: "Stress response: ER", RGS: 7, AC: 24, PValue: 7.61678139538679e-06, Bonferroni: 0.000860696297678707 },
    { Category: "Stress response: unassigned", RGS: 9, AC: 49, PValue: 1.03621186830759e-05, Bonferroni: 0.00117091941118758 },
    { Category: "Transmembrane transport: ABC", RGS: 9, AC: 50, PValue: 1.19627228894624e-05, Bonferroni: 0.00135178768650925 },
    { Category: "Stress response: signaling", RGS: 4, AC: 4, PValue: 2.19866743332363e-05, Bonferroni: 0.0024844941996557 },
    { Category: "Transmembrane protein: unassigned", RGS: 70, AC: 1692, PValue: 8.55881961408897e-05, Bonferroni: 0.00967146616392054 }

  ],
  cat3_apv: [
    { Category: "Stress response: pathogen: unassigned", RGS: 30, AC: 96, PValue: 4.26029392670679e-21, Bonferroni: 6.98688203979914e-19 },
    { Category: "Proteolysis proteasome: E3: F box", RGS: 37, AC: 437, PValue: 1.15677866423555e-09, Bonferroni: 1.8971170093463e-07 },
    { Category: "Unassigned: regulated by multiple stresses", RGS: 86, AC: 1707, PValue: 1.15135929125144e-08, Bonferroni: 1.88822923765236e-06 },
    { Category: "Transcription factor: NHR", RGS: 22, AC: 259, PValue: 2.06528889221412e-06, Bonferroni: 0.000338707378323116 },
    { Category: "Stress response: ER", RGS: 7, AC: 24, PValue: 7.61678139538679e-06, Bonferroni: 0.00124915214884343 },
    { Category: "Stress response: pathogen: CUB", RGS: 7, AC: 25, PValue: 9.54404290128138e-06, Bonferroni: 0.00156522303581015 },
    { Category: "Stress response: unassigned", RGS: 9, AC: 49, PValue: 1.03621186830759e-05, Bonferroni: 0.00169938746402445 },
    { Category: "Transmembrane transport: ABC", RGS: 9, AC: 50, PValue: 1.19627228894624e-05, Bonferroni: 0.00196188655387183 },
    { Category: "Stress response: detoxification: ugt", RGS: 10, AC: 69, PValue: 2.16557292913051e-05, Bonferroni: 0.00355153960377404 },
    { Category: "Stress response: signaling", RGS: 4, AC: 4, PValue: 2.19866743332363e-05, Bonferroni: 0.00360581459065075 }

  ]
};

function App() {
  return <WormCatReport uiData={someUiData} />;
}

export default App;