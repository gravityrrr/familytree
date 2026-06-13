'use client';

import React, { useState } from 'react';
import type { Person, RelationshipType } from '@/types';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';
import { GothraAutocomplete } from '@/components/ui/GothraAutocomplete';

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
  const [middleName, setMiddleName] = useState(initialData.middle_name || '');
  const [lastName, setLastName] = useState(initialData.last_name || '');
  const [nickname, setNickname] = useState(initialData.nickname || '');
  const [gender, setGender] = useState(initialData.gender || '');
  const [gothra, setGothra] = useState(initialData.gothra || '');
  const [birthDate, setBirthDate] = useState(initialData.birth_date || '');
  const [birthYear, setBirthYear] = useState(
    initialData.birth_year?.toString() || ''
  );
  const [birthPlace, setBirthPlace] = useState(initialData.birth_place || '');
  const [birthArea, setBirthArea] = useState(initialData.birth_area || '');
  const [deathDate, setDeathDate] = useState(initialData.death_date || '');
  const [deathPlace, setDeathPlace] = useState(initialData.death_place || '');
  const [deathArea, setDeathArea] = useState(initialData.death_area || '');
  const [isLiving, setIsLiving] = useState(initialData.is_living ?? true);
  const [bio, setBio] = useState(initialData.bio || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [email, setEmail] = useState(initialData.email || '');

  const [generateSystemId, setGenerateSystemId] = useState(false);
  const systemId = initialData.system_id || '';
  
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Identity Validation
    if (!phone && !email && !systemId && !generateSystemId) {
      setErrorMsg('Please provide a Phone number or Email, or check the box to generate a System ID.');
      return;
    }

    setLoading(true);
    try {
      const finalSystemId = (generateSystemId && !systemId) 
        ? `SYS-${Math.random().toString(36).substring(2, 10).toUpperCase()}` 
        : systemId;

      await onSubmit({
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName || null,
        nickname: nickname || null,
        gender: (gender || 'unknown') as Person['gender'],
        gothra: gothra || null,
        birth_date: birthDate || null,
        birth_year: birthYear ? parseInt(birthYear) : null,
        birth_place: birthPlace || null,
        birth_area: birthArea || null,
        death_date: deathDate || null,
        death_place: deathPlace || null,
        death_area: deathArea || null,
        is_living: isLiving,
        bio: bio || null,
        phone: phone || null,
        email: email || null,

        system_id: finalSystemId || null,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving the person.');
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
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-slate-900 cursor-pointer"
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
          label="Middle Name"
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
          placeholder="Optional"
          id="person-middle-name"
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
        <GothraAutocomplete
          label="Gothra"
          value={gothra}
          onChange={setGothra}
          placeholder="Search or add a gothra..."
          id="person-gothra"
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

      {/* Identity Verification section */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
          Identity Verification
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          To prevent duplicate entries, please provide at least one unique identifier.
        </p>
        
        {systemId && (
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm flex justify-between">
            <span className="text-slate-500">System ID</span>
            <span className="font-mono font-medium">{systemId}</span>
          </div>
        )}

        <Input
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 9876543210"
          id="person-phone"
        />

        <Input
          label="Email Address (Optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          id="person-email"
        />

        {!systemId && (
          <label className="flex items-start gap-3 mt-4 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <input
              type="checkbox"
              checked={generateSystemId}
              onChange={(e) => setGenerateSystemId(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 block">I don't have their Phone or Email</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">The system will generate a unique ID for this person.</span>
            </div>
          </label>
        )}
        
        {errorMsg && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2 p-2 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-900/30">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Birth section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
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
        <LocationAutocomplete
          label="Birthplace (City/Country)"
          value={birthPlace}
          onChange={setBirthPlace}
          placeholder="e.g. Bengaluru, India"
          id="person-birth-place"
        />
        <LocationAutocomplete
          label="Neighborhood / Area"
          value={birthArea}
          onChange={setBirthArea}
          placeholder="e.g. Kaggadasapura, Koramangala"
          id="person-birth-area"
        />
      </div>

      {/* Death section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Death
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isLiving}
              onChange={(e) => setIsLiving(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">Still living</span>
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
            <LocationAutocomplete
              label="Place of Death (City/Country)"
              value={deathPlace}
              onChange={setDeathPlace}
              placeholder="City, Country"
              id="person-death-place"
            />
            <LocationAutocomplete
              label="Neighborhood / Area"
              value={deathArea}
              onChange={setDeathArea}
              placeholder="e.g. Indiranagar"
              id="person-death-area"
            />
          </>
        )}
        {isLiving && (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
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
      <Button type="submit" loading={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25" size="lg">
        {isEdit ? 'Save Changes' : 'Add Person'}
      </Button>

      {/* Delete button (edit mode only) */}
      {isEdit && onDelete && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
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
