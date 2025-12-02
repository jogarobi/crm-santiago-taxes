import type { CatalogObject } from 'square';

export type { CatalogObject };

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
