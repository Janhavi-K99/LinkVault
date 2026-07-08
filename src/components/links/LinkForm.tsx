import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { FileAttachment } from './FileAttachment'
import { CustomFieldsSection } from './CustomFieldsSection'
import { FormFieldSettings } from '@/components/features/FormFieldSettings'
import { useFieldSettings } from '@/store/useFieldSettings'
import type { Link, CustomField } from '@/core/types'
import { useLinks, useFolders } from '@/store/useStore'
import { generateId, readFileAsBuffer, isValidUrl, tagColor } from '@/core/utils'
import { toast } from 'react-hot-toast'
import { db } from '@/core/database'

import type { Attachment } from '@/core/types'
import { Plus, Clipboard, Upload } from 'lucide-react'

interface LinkFormProps {
  link?: Link
  folderId?: string | null
  onDone: () => void
}

export function LinkForm({ link, folderId: initialFolderId, onDone }: LinkFormProps) {
  const { folders } = useFolders()
  const { addLink, updateLink } = useLinks()
  const { isEnabled } = useFieldSettings()
  const [title, setTitle] = useState(link?.title ?? '')
  const [url, setUrl] = useState(link?.url ?? '')
  const [description, setDescription] = useState(link?.description ?? '')
  const [notes, setNotes] = useState(link?.notes ?? '')
  const [folderId, setFolderId] = useState(link?.folderId ?? initialFolderId ?? '')
  const [isFavorite, setIsFavorite] = useState(link?.isFavorite ?? false)
  const [tags, setTags] = useState<string[]>(link?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [customFields, setCustomFields] = useState<CustomField[]>(link?.customFields ?? [])
  const [saving, setSaving] = useState(false)

  const isEditing = !!link

  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const pasteInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) => f.size <= 50 * 1024 * 1024)
    const oversized = Array.from(files).filter((f) => f.size > 50 * 1024 * 1024)
    if (oversized.length > 0) toast.error(`${oversized.length} file(s) skipped (max 50MB)`)
    if (valid.length > 0) setPendingFiles((prev) => [...prev, ...valid])
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const files: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }
    if (files.length > 0) { e.preventDefault(); addFiles(files) }
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    if (!isValidUrl(url)) { toast.error('Please enter a valid URL'); return }
    setSaving(true)
    try {
      const data = {
        title: title.trim(),
        url: url.trim(),
        description: isEnabled('description') ? description.trim() : (link?.description ?? ''),
        notes: isEnabled('notes') ? notes.trim() : (link?.notes ?? ''),
        tags: isEnabled('tags') ? tags : (link?.tags ?? []),
        customFields: isEnabled('customFields') ? customFields.filter((f) => f.key.trim()) : (link?.customFields ?? []),
        folderId: isEnabled('folder') ? (folderId || null) : (link?.folderId ?? null),
        isFavorite: isEnabled('favorite') ? isFavorite : (link?.isFavorite ?? false),
        isArchived: link?.isArchived ?? false,
      }
      if (link) {
        await updateLink(link.id, data)
        toast.success('Link updated')
      } else {
        const saved = await addLink(data)
        if (isEnabled('attachments') && saved && pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            try {
              const data = await readFileAsBuffer(file)
              const att: Attachment = {
                id: generateId(),
                linkId: saved.id,
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size,
                data,
                createdAt: Date.now(),
              }
              await db.attachments.add(att)
            } catch {
              toast.error(`Failed to attach ${file.name}`)
            }
          }
        }
        toast.success('Link saved')
      }
      onDone()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t))

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Fields marked with * are required</p>
        <FormFieldSettings />
      </div>

      {/* === REQUIRED === */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Required</h3>
        <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Link title" required autoFocus />
        <Input label="URL *" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required type="url" />
      </div>

      {/* === DESCRIPTION === */}
      {isEnabled('description') && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</h3>
          <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this link" />
        </div>
      )}

      {/* === TAGS === */}
      {isEnabled('tags') && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</h3>
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <Badge key={t} color={tagColor(t)} removable onRemove={() => removeTag(t)}>
                  {t}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Type a tag and press Enter..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-vault-500 focus:ring-2 focus:ring-vault-500/20 outline-none"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addTag}><Plus size={14} /></Button>
            </div>
          </div>
        </div>
      )}

      {/* === FILES === */}
      {isEnabled('attachments') && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Attachments</h3>

          {isEditing ? (
            <>
              <div
                onPaste={handlePaste}
                tabIndex={0}
                onClick={() => pasteInputRef.current?.click()}
                className="border-2 border-dashed border-violet-200 rounded-xl p-5 text-center cursor-pointer hover:border-violet-400 transition-colors bg-violet-50/40 outline-none focus:border-violet-500 focus:bg-violet-50"
              >
                <input ref={pasteInputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }} />
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                  <Clipboard size={22} className="text-violet-400" />
                  <p className="text-sm font-medium text-gray-600">Paste screenshots or click to browse</p>
                  <p className="text-xs text-gray-400">Ctrl+V to paste &bull; click to pick files</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-1">Click on the box above once, then Ctrl+V to paste</p>
              <FileAttachment linkId={link!.id} />
            </>
          ) : (
            <>
              <div
                onPaste={handlePaste}
                tabIndex={0}
                className="border-2 border-dashed border-violet-200 rounded-xl p-5 text-center bg-violet-50/40 outline-none"
              >
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                  <Clipboard size={22} className="text-violet-400" />
                  <p className="text-sm font-medium text-gray-600">Paste screenshots</p>
                  <p className="text-xs text-gray-400">Ctrl+V to paste from clipboard</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-1">Click on the box above once, then Ctrl+V to paste</p>

              <div className="flex items-center gap-3">
                <label htmlFor="file-upload-add" className="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-vault-500/40 cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 shadow-sm px-2.5 py-1.5 text-xs gap-1.5">
                  <Upload size={14} /> Upload from PC
                </label>
                <input ref={uploadInputRef} id="file-upload-add" type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }} />
                <span className="text-xs text-gray-400">Images, PDFs, docs &mdash; up to 50MB</span>
              </div>

              {/* Pending files list */}
              {pendingFiles.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500">{pendingFiles.length} file(s) ready — will be attached after saving</p>
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                      {f.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(f)} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-400 shrink-0 text-xs">
                          {f.name.split('.').pop()}
                        </div>
                      )}
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => removePendingFile(i)} className="text-gray-400 hover:text-red-500 cursor-pointer">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === CUSTOM FIELDS === */}
      {isEnabled('customFields') && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Extra Fields</h3>
          <CustomFieldsSection fields={customFields} onChange={setCustomFields} />
        </div>
      )}

      {/* === ORGANIZATION === */}
      {(isEnabled('folder') || isEnabled('favorite')) && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Organization</h3>
          {isEnabled('folder') && (
            <Select
              label="Folder"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              options={folders.map((f) => ({ value: f.id, label: f.name }))}
              placeholder="No folder"
            />
          )}
          {isEnabled('favorite') && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="rounded border-gray-300 text-vault-600 focus:ring-vault-500"
              />
              <span className="text-sm text-gray-700">Add to Favorites</span>
            </label>
          )}
        </div>
      )}

      {/* === ACTIONS === */}
      <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={saving} disabled={!title.trim() || !url.trim()}>
          {isEditing ? 'Save Changes' : 'Save Link'}
        </Button>
      </div>
    </form>
  )
}
