export interface CatalogItem {
  id?: string;
  type?: string;
  itemData?: {
    name?: string;
    description?: string;
    abbreviation?: string;
    variations?: CatalogItemVariation[];
  };
}

export interface CatalogItemVariation {
  id?: string;
  type?: string;
  itemVariationData?: {
    itemId?: string;
    name?: string;
    pricingType?: string;
    serviceDuration?: number;
  };
}

export interface CatalogObject {
  id?: string;
  type?: string;
  itemData?: {
    name?: string;
    description?: string;
    variations?: Array<{
      type?: string;
      id?: string;
      itemVariationData?: {
        itemId?: string;
        name?: string;
        serviceDuration?: number;
      };
    }>;
  };
  itemVariationData?: {
    itemId?: string;
    name?: string;
    serviceDuration?: number;
  };
}

export interface CatalogObjectResponse {
  success: boolean;
  object: CatalogObject;
  relatedObjects?: CatalogObject[];
}

export interface BatchRetrieveCatalogObjectsResponse {
  success: boolean;
  objects: CatalogObject[];
}

export interface CatalogErrorResponse {
  success: false;
  error: string;
  message: string;
}
