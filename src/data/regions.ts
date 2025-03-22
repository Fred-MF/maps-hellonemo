import { Region } from '../types/api';

// Liste des régions disponibles avec leurs API
export const regions: Region[] = [
  { id: 'ara', name: 'Auvergne-Rhône-Alpes', apiUrl: 'https://otp-ara.maasify.io/graphiql' },
  { id: 'bfc', name: 'Bourgogne-Franche-Comté', apiUrl: 'https://otp-bfc.maasify.io/graphiql' },
  { id: 'bre', name: 'Bretagne', apiUrl: 'https://otp-bre.maasify.io/graphiql' },
  { id: 'caraibe', name: 'Guyane', apiUrl: 'https://otp-caraibe.maasify.io/graphiql' },
  { id: 'cor', name: 'Corse', apiUrl: 'https://otp-cor.maasify.io/graphiql' },
  { id: 'cvl', name: 'Centre-Val de Loire', apiUrl: 'https://otp-cvl.maasify.io/graphiql' },
  { id: 'ges', name: 'Grand Est', apiUrl: 'https://otp-ges.maasify.io/graphiql' },
  { id: 'gf', name: 'Guadeloupe', apiUrl: 'https://otp-gf.maasify.io/graphiql' },
  { id: 'hdf', name: 'Hauts-de-France', apiUrl: 'https://otp-hdf.maasify.io/graphiql' },
  { id: 'idf', name: 'Ile-de-France', apiUrl: 'https://otp-idf.maasify.io/graphiql' },
  { id: 'mar', name: 'Martinique', apiUrl: 'https://otp-mar.maasify.io/graphiql' },
  { id: 'naq', name: 'Nouvelle-Aquitaine', apiUrl: 'https://otp-naq.maasify.io/graphiql' },
  { id: 'nor', name: 'Normandie', apiUrl: 'https://otp-nor.maasify.io/graphiql' },
  { id: 'occ', name: 'Occitanie', apiUrl: 'https://otp-occ.maasify.io/graphiql' },
  { id: 'paca', name: 'Provence Alpes Côte d\'Azur', apiUrl: 'https://otp-paca.maasify.io/graphiql' },
  { id: 'pdl', name: 'Pays de la Loire', apiUrl: 'https://otp-pdl.maasify.io/graphiql' },
  { id: 're', name: 'Réunion', apiUrl: 'https://otp-re.maasify.io/graphiql' },
];