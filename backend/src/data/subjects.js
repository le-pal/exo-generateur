export const LEVELS = [
  { value: 'CP', label: 'CP', group: 'Primaire' },
  { value: 'CE1', label: 'CE1', group: 'Primaire' },
  { value: 'CE2', label: 'CE2', group: 'Primaire' },
  { value: 'CM1', label: 'CM1', group: 'Primaire' },
  { value: 'CM2', label: 'CM2', group: 'Primaire' },
  { value: '6ème', label: '6ème', group: 'Collège' },
  { value: '5ème', label: '5ème', group: 'Collège' },
  { value: '4ème', label: '4ème', group: 'Collège' },
  { value: '3ème', label: '3ème', group: 'Collège' },
  { value: '2nde', label: '2nde', group: 'Lycée' },
  { value: '1ère', label: '1ère', group: 'Lycée' },
  { value: 'Terminale', label: 'Terminale', group: 'Lycée' },
];

export const SUBJECTS = [
  { value: 'Français', label: 'Français', levels: 'all' },
  { value: 'Mathématiques', label: 'Mathématiques', levels: 'all' },
  { value: 'Histoire-Géographie', label: 'Histoire-Géographie', levels: 'all' },
  { value: 'Anglais', label: 'Anglais (LV1)', levels: 'all' },
  { value: 'Sciences', label: 'Sciences', levels: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] },
  { value: 'SVT', label: 'SVT', levels: ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'] },
  { value: 'Physique-Chimie', label: 'Physique-Chimie', levels: ['5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'] },
  { value: 'Technologie', label: 'Technologie', levels: ['6ème', '5ème', '4ème', '3ème'] },
  { value: 'Espagnol', label: 'Espagnol (LV2)', levels: ['4ème', '3ème', '2nde', '1ère', 'Terminale'] },
  { value: 'Allemand', label: 'Allemand (LV2)', levels: ['4ème', '3ème', '2nde', '1ère', 'Terminale'] },
  { value: 'Arts Plastiques', label: 'Arts Plastiques', levels: 'all' },
  { value: 'Musique', label: 'Musique (Éducation musicale)', levels: 'all' },
  { value: 'Philosophie', label: 'Philosophie', levels: ['Terminale'] },
  { value: 'SES', label: 'SES', levels: ['2nde', '1ère', 'Terminale'] },
  { value: 'NSI', label: 'NSI (Informatique)', levels: ['1ère', 'Terminale'] },
];

export const DIFFICULTIES = [
  { value: 'facile', label: 'Facile' },
  { value: 'normal', label: 'Normal' },
  { value: 'difficile', label: 'Difficile' },
];
