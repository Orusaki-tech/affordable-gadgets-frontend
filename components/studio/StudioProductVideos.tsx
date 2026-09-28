'use client';

import { useEffect, useState } from 'react';

export type StudioVideoRow = { url: string; title: string };

type StudioProductVideosProps = {
  videos: StudioVideoRow[];
  onChange: (videos: StudioVideoRow[]) => void;
  videoFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  existingFileUrl?: string | null;
  disabled?: boolean;
};

export function StudioProductVideos({
  videos,
  onChange,
  videoFile,
  onVideoFileChange,
  existingFileUrl,
  disabled,
}: StudioProductVideosProps) {
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  useEffect(() => {
    setFileLabel(videoFile?.name || null);
  }, [videoFile]);

  const updateRow = (index: number, patch: Partial<StudioVideoRow>) => {
    onChange(videos.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="studio-images">
      <div className="studio-images__head">
        <h3 className="studio-images__title">Product videos</h3>
        <button
          type="button"
          className="studio-btn studio-btn--ghost"
          disabled={disabled}
          onClick={() => onChange([...videos, { url: '', title: '' }])}
        >
          + Add link
        </button>
      </div>
      <p className="studio-editor__hint" style={{ marginTop: 0 }}>
        Same as admin: YouTube / Shorts / Vimeo links. For the homepage reel, also tag the product
        “Video” in ops admin.
      </p>
      <div className="studio-videos">
        {videos.map((row, index) => (
          <div key={`video-${index}`} className="studio-videos__row">
            <input
              className="studio-input"
              placeholder="https://youtube.com/..."
              value={row.url}
              disabled={disabled}
              onChange={(e) => updateRow(index, { url: e.target.value })}
            />
            <input
              className="studio-input"
              placeholder="Optional title"
              value={row.title}
              disabled={disabled}
              onChange={(e) => updateRow(index, { title: e.target.value })}
            />
            <button
              type="button"
              className="studio-images__action studio-images__action--danger"
              disabled={disabled || videos.length <= 1}
              onClick={() => onChange(videos.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <label className="studio-field" style={{ marginTop: '0.75rem' }}>
        <span>Upload video file (optional)</span>
        <input
          type="file"
          accept="video/*"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            onVideoFileChange(file);
            e.target.value = '';
          }}
        />
        {(fileLabel || existingFileUrl) && (
          <small className="studio-editor__hint">
            {fileLabel ? `Selected: ${fileLabel}` : `Current file on product`}
          </small>
        )}
      </label>
    </div>
  );
}

export function videosFromProduct(product?: {
  videos?: Array<{ url?: string; title?: string }>;
  product_video_url?: string | null;
} | null): StudioVideoRow[] {
  const vids = product?.videos;
  if (Array.isArray(vids) && vids.length > 0) {
    return vids.map((v) => ({ url: v.url || '', title: v.title || '' }));
  }
  if (product?.product_video_url) {
    return [{ url: product.product_video_url, title: '' }];
  }
  return [{ url: '', title: '' }];
}
