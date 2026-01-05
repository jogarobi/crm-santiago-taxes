import { NextResponse } from 'next/server';
import { square } from '@/app/api/clients';
import {
  CatalogObject,
  BatchRetrieveCatalogObjectsResponse,
  CatalogErrorResponse,
} from '@/lib/types/catalog';

// POST /api/catalog/batch-retrieve - Retrieve multiple catalog objects
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { objectIds } = body;

    if (!objectIds || !Array.isArray(objectIds) || objectIds.length === 0) {
      const errorResponse: CatalogErrorResponse = {
        success: false,
        error: 'Missing or invalid object IDs',
        message: 'objectIds must be a non-empty array',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const response = await square.catalog.batchGet({
      objectIds,
      includeRelatedObjects: true,
    });

    // Serialize BigInt values to strings for JSON compatibility
    const serializedObjects: CatalogObject[] = JSON.parse(
      JSON.stringify(response.objects || [], (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    const catalogResponse: BatchRetrieveCatalogObjectsResponse = {
      success: true,
      objects: serializedObjects,
    };

    return NextResponse.json(catalogResponse);
  } catch (error) {
    console.error('Error fetching catalog objects:', error);
    const errorResponse: CatalogErrorResponse = {
      success: false,
      error: 'Failed to fetch catalog objects',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
