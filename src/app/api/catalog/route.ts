import { NextResponse } from 'next/server';
import { square } from '@/app/api/clients';
import { CatalogErrorResponse } from '@/lib/types/catalog';
import type { CatalogObject } from 'square';

export type { CatalogObject };

export async function GET() {
  try {
    const page = await square.catalog.list({
      types: 'ITEM',
    });

    const allObjects: CatalogObject[] = [];
    for (const item of page.data) {
      allObjects.push(item as CatalogObject);
    }

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
