export const SCIENTIFIC_NAME_WITH_AUTHOR: Record<string, string> = {
  "vachellia nilotica": "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.",
  "lantana camara": "Lantana camara L.",
  "merremia hederacea": "Merremia hederacea (Burm.f.) Hallier f.",
  "clitoria ternatea": "Clitoria ternatea L.",
  "ageratum conyzoides": "Ageratum conyzoides L.",
};

export const getBinomialName = (scientificName: string) =>
  scientificName.trim().split(/\s+/).slice(0, 2).join(" ");

export const getScientificNameWithAuthor = (scientificName: string) => {
  const binomialName = getBinomialName(scientificName).toLowerCase();
  return SCIENTIFIC_NAME_WITH_AUTHOR[binomialName] || scientificName;
};

export const createScientificNameSlug = (scientificName: string) =>
  getBinomialName(scientificName).toLowerCase().replace(/\s+/g, "-");
