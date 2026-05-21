import { translateText, type TranslateLanguage } from "./client";

interface SpeciesDescriptionInput {
  botanicalDescription: string;
  ecologicalInformation: string;
  environmentalImpact: string;
  sourceLanguage: TranslateLanguage;
}

export async function translateSpeciesDescriptions({
  botanicalDescription,
  ecologicalInformation,
  environmentalImpact,
  sourceLanguage,
}: SpeciesDescriptionInput) {
  const targetLanguage: TranslateLanguage = sourceLanguage === "id" ? "en" : "id";
  const [
    translatedDescription,
    translatedEcology,
    translatedImpact,
  ] = await Promise.all([
    translateText(botanicalDescription, sourceLanguage, targetLanguage),
    translateText(ecologicalInformation, sourceLanguage, targetLanguage),
    translateText(environmentalImpact, sourceLanguage, targetLanguage),
  ]);

  return {
    botanicalDescriptionEn: sourceLanguage === "en" ? botanicalDescription : translatedDescription,
    botanicalDescriptionId: sourceLanguage === "id" ? botanicalDescription : translatedDescription,
    ecologicalInformationEn: sourceLanguage === "en" ? ecologicalInformation : translatedEcology,
    ecologicalInformationId: sourceLanguage === "id" ? ecologicalInformation : translatedEcology,
    environmentalImpactEn: sourceLanguage === "en" ? environmentalImpact : translatedImpact,
    environmentalImpactId: sourceLanguage === "id" ? environmentalImpact : translatedImpact,
  };
}
