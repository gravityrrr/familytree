'use client';

import React, { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { EventType } from '@/types';

interface EventFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (eventData: {
    title: string;
    event_type: EventType;
    event_date: string | null;
    event_year: number | null;
    event_place: string | null;
    description: string | null;
  }) => Promise<void>;
}

const EVENT_TYPE_OPTIONS = [
  { value: 'marriage', label: 'Marriage' },
  { value: 'divorce', label: 'Divorce' },
  { value: 'moved', label: 'Relocation / Moved' },
  { value: 'graduated', label: 'Graduation' },
  { value: 'military', label: 'Military Service' },
  { value: 'birth', label: 'Birth' },
  { value: 'death', label: 'Death' },
  { value: 'other', label: 'Other Event' },
];

export function EventFormSheet({ open, onClose, onSubmit }: EventFormSheetProps) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('other');
  const [eventDate, setEventDate] = useState('');
  const [eventYear, setEventYear] = useState('');
  const [eventPlace, setEventPlace] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        event_type: eventType,
        event_date: eventDate || null,
        event_year: eventYear ? parseInt(eventYear) : null,
        event_place: eventPlace || null,
        description: description || null,
      });
      // Reset form
      setTitle('');
      setEventType('other');
      setEventDate('');
      setEventYear('');
      setEventPlace('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add Life Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Married Sarah Johnson, Graduated from University"
          id="event-title"
        />

        <Select
          label="Event Type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
          options={EVENT_TYPE_OPTIONS}
          id="event-type"
        />

        <Input
          label="Event Date"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          id="event-date"
        />

        <Input
          label="Approximate Year"
          type="number"
          value={eventYear}
          onChange={(e) => setEventYear(e.target.value)}
          placeholder="e.g. 1995"
          hint="Optional: Use if exact date is unknown"
          id="event-year"
        />

        <Input
          label="Location"
          value={eventPlace}
          onChange={(e) => setEventPlace(e.target.value)}
          placeholder="e.g. London, UK"
          id="event-location"
        />

        <Textarea
          label="Description / Notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add extra context or details about this event..."
          rows={3}
          id="event-description"
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={!title}
            className="flex-1"
          >
            Save Event
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
