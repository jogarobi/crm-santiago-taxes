import { NextResponse } from 'next/server';
import { square } from '@/app/api/clients';
import {
  CatalogObject,
  CatalogObjectResponse,
  CatalogErrorResponse,
} from '@/lib/types/catalog';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      const errorResponse: CatalogErrorResponse = {
        success: false,
        error: 'Missing catalog object ID',
        message: 'Object ID is required',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const response = await square.catalog.object.get({
      objectId: id,
      includeRelatedObjects: true,
    });

    const serializedObject: CatalogObject = JSON.parse(
      JSON.stringify(response.object || {}, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    const serializedRelatedObjects: CatalogObject[] = JSON.parse(
      JSON.stringify(response.relatedObjects || [], (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    const catalogResponse: CatalogObjectResponse = {
      success: true,
      object: serializedObject,
      relatedObjects: serializedRelatedObjects,
    };

    return NextResponse.json(catalogResponse);
  } catch (error) {
    console.error('Error fetching catalog object:', error);
    const errorResponse: CatalogErrorResponse = {
      success: false,
      error: 'Failed to fetch catalog object',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
