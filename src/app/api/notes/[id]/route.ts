import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { note } from '@/db/migrations/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ note: ['read'] });

    const { id } = await params;
    const noteId = parseInt(id);

    if (isNaN(noteId)) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(note)
      .where(eq(note.id, noteId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ note: ['update'] });

    const { id } = await params;
    const noteId = parseInt(id);
    const body = await request.json();

    if (isNaN(noteId)) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    if (!body.updatedBy) {
      return NextResponse.json(
        { error: 'Missing required field: updatedBy' },
        { status: 400 }
      );
    }

    const existingNote = await db
      .select()
      .from(note)
      .where(eq(note.id, noteId))
      .limit(1);

    if (existingNote.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const updatedNote = await db
      .update(note)
      .set({
        content: body.content,
        updatedBy: body.updatedBy,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(note.id, noteId))
      .returning();

    return NextResponse.json(updatedNote[0]);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission({ note: ['delete'] });

    const { id } = await params;
    const noteId = parseInt(id);

    if (isNaN(noteId)) {
      return NextResponse.json(
        { error: 'Invalid note ID' },
        { status: 400 }
      );
    }

    const existingNote = await db
      .select()
      .from(note)
      .where(eq(note.id, noteId))
      .limit(1);

    if (existingNote.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await db.delete(note).where(eq(note.id, noteId));

    return NextResponse.json(
      { message: 'Note deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
