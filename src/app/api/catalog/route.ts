import { NextResponse } from 'next/server';
import { square } from '@/app/api/client';
import {
  CatalogObject,
  CatalogErrorResponse,
} from '@/lib/types/catalog';

// GET /api/catalog - List all catalog items
export async function GET() {
  try {
    const page = await square.catalog.list({
      types: 'ITEM',
    });

    // Collect all items from the page
    const allObjects: CatalogObject[] = [];
    for (const item of page.data) {
      allObjects.push(item as CatalogObject);
    }

    // Serialize BigInt values to strings for JSON compatibility
    const serializedObjects: CatalogObject[] = JSON.parse(
      JSON.stringify(allObjects, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json({
      success: true,
      objects: serializedObjects,
    });
  } catch (error) {
    console.error('Error listing catalog items:', error);
    const errorResponse: CatalogErrorResponse = {
      success: false,
      error: 'Failed to list catalog items',
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
