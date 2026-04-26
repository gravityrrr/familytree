'use client';

import React, { useState } from 'react';
import type { Person, RelationshipType } from '@/types';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

interface PersonFormProps {
  /** Initial data for edit mode, empty for add mode */
  initialData?: Partial<Person>;
  /** Called when the form is submitted */
  onSubmit: (data: Partial<Person>) => Promise<void>;
  /** Called when user wants to delete */
  onDelete?: () => void;
  /** Whether the form is in edit mode */
  isEdit?: boolean;
  /** Called when user taps the avatar to upload a photo */
  onPhotoUpload?: () => void;
  /** Available relationship types for the dropdown */
  showRelationship?: boolean;
  /** Selected relationship */
  relationship?: RelationshipType;
  onRelationshipChange?: (type: RelationshipType) => void;
}

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];

const RELATIONSHIP_OPTIONS = [
  { value: '', label: 'Select relationship' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle' },
  { value: 'niece_nephew', label: 'Niece/Nephew' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'other', label: 'Other' },
];

/**
 * Shared form for adding and editing a person.
 * Fields: name, nickname, gender, birth, death, bio.
 */
export function PersonForm({
  initialData = {},
  onSubmit,
  onDelete,
  isEdit = false,
  onPhotoUpload,
  showRelationship = false,
  relationship = '' as RelationshipType,
  onRelationshipChange,
}: PersonFormProps) {
  const [firstName, setFirstName] = useState(initialData.first_name || '');
  const [lastName, setLastName] = useState(initialData.last_name || '');
  const [nickname, setNickname] = useState(initialData.nickname || '');
  const [gender, setGender] = useState(initialData.gender || '');
  const [birthDate, setBirthDate] = useState(initialData.birth_date || '');
  const [birthYear, setBirthYear] = useState(
    initialData.birth_year?.toString() || ''
  );
  const [birthPlace, setBirthPlace] = useState(initialData.birth_place || '');
  const [deathDate, setDeathDate] = useState(initialData.death_date || '');
  const [deathPlace, setDeathPlace] = useState(initialData.death_place || '');
  const [isLiving, setIsLiving] = useState(initialData.is_living ?? true);
  const [bio, setBio] = useState(initialData.bio || '');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        first_name: firstName,
        last_name: lastName || null,
        nickname: nickname || null,
        gender: (gender || 'unknown') as Person['gender'],
        birth_date: birthDate || null,
        birth_year: birthYear ? parseInt(birthYear) : null,
        birth_place: birthPlace || null,
        death_date: deathDate || null,
        death_place: deathPlace || null,
        is_living: isLiving,
        bio: bio || null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
      {/* Photo upload area */}
      {isEdit && (
        <div className="flex justify-center pt-4">
          <div className="relative">
            <Avatar
              firstName={firstName || '?'}
              lastName={lastName}
              photoUrl={initialData.photo_url}
              size="xl"
              onClick={onPhotoUpload}
            />
            <div
              className="absolute bottom-0 right-0 w-7 h-7 bg-brand rounded-full flex items-center justify-center shadow-sm border-2 border-white cursor-pointer"
              onClick={onPhotoUpload}
            >
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Name fields */}
      <div className="space-y-4">
        <Input
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          placeholder="Enter first name"
          id="person-first-name"
        />
        <Input
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Enter last name"
          id="person-last-name"
        />
        <Input
          label="Nickname / Maiden Name"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Optional"
          id="person-nickname"
        />
        <Select
          label="Gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          options={GENDER_OPTIONS}
          id="person-gender"
        />
        {showRelationship && (
          <Select
            label="Relationship to You"
            value={relationship}
            onChange={(e) =>
              onRelationshipChange?.(e.target.value as RelationshipType)
            }
            options={RELATIONSHIP_OPTIONS}
            id="person-relationship"
          />
        )}
      </div>

      {/* Birth section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Birth
        </h3>
        <Input
          label="Birth Date"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          id="person-birth-date"
        />
        <Input
          label="Approximate Birth Year"
          type="number"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder="e.g. 1965"
          hint="Use if exact date is unknown"
          id="person-birth-year"
        />
        <Input
          label="Birthplace"
          value={birthPlace}
          onChange={(e) => setBirthPlace(e.target.value)}
          placeholder="City, Country"
          id="person-birth-place"
        />
      </div>

      {/* Death section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Death
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isLiving}
              onChange={(e) => setIsLiving(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <span className="text-sm text-gray-600">Still living</span>
          </label>
        </div>
        {!isLiving && (
          <>
            <Input
              label="Date of Death"
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              id="person-death-date"
            />
            <Input
              label="Place of Death"
              value={deathPlace}
              onChange={(e) => setDeathPlace(e.target.value)}
              placeholder="City, Country"
              id="person-death-place"
            />
          </>
        )}
        {isLiving && (
          <p className="text-xs text-gray-400 italic">
            Leave blank if this person is still living
          </p>
        )}
      </div>

      {/* Bio */}
      <Textarea
        label="Biography / Notes"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Write something about this person..."
        rows={4}
        id="person-bio"
      />

      {/* Submit */}
      <Button type="submit" loading={loading} className="w-full" size="lg">
        {isEdit ? 'Save Changes' : 'Add Person'}
      </Button>

      {/* Delete button (edit mode only) */}
      {isEdit && onDelete && (
        <div className="pt-4 border-t border-gray-100">
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600 text-center">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1"
                  onClick={onDelete}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="danger"
              className="w-full"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Remove from Tree
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
