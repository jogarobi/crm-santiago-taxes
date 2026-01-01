'use client';

import { Note } from '@/lib/types/note';
import { ClockIcon, UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotesGridProps {
  notes: Note[];
  onNoteClick?: (note: Note) => void;
}

export function NotesGrid({ notes, onNoteClick }: NotesGridProps) {
  if (notes.length === 0) {
    return (
      <div className='text-center py-12 text-neutral-500'>
        <p>No notes found</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
      {notes.map((note) => {
        return (
          <div
            key={note.id}
            className='bg-yellow-100 border-yellow-200 border rounded-lg p-5 shadow-md hover:shadow-xl transition-shadow duration-200 transform hover:-translate-y-1 cursor-pointer relative min-h-[250px] flex flex-col'
            onClick={() => onNoteClick?.(note)}
          >
            <div className='flex-1 mb-6'>
              <p className='text-gray-800 whitespace-pre-wrap wrap-break-word leading-relaxed text-[15px] line-clamp-6'>
                {note.content || '(Empty note)'}
              </p>
            </div>

            <div className='flex flex-col gap-2 text-[13px] text-gray-600 mt-auto'>
              <div className='flex items-center gap-1.5'>
                <UserIcon size={14} strokeWidth={2.5} />
                <span className='font-medium truncate'>{note.createdBy}</span>
              </div>

              <div className='flex items-center gap-1.5'>
                <ClockIcon size={12} strokeWidth={2.5} />
                <span>
                  {formatDistanceToNow(new Date(note.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
