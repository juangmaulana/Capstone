export class Plant {
  constructor(
    public id: number,
    public commonName: string,
    public scientificName: string,
    public family: string,
    public genus: string,
    public botanicalDescription: string,
    public ecologicalInformation: string,
    public environmentalImpact: string,
    public botanicalDescriptionEn: string,
    public botanicalDescriptionId: string,
    public ecologicalInformationEn: string,
    public ecologicalInformationId: string,
    public environmentalImpactEn: string,
    public environmentalImpactId: string,
    public imagePath: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
