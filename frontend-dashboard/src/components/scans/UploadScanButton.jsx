import { useRef, useState } from 'react';
import api from '../../lib/api';

export default function UploadScanButton({ onUploaded }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const { data } = await api.post('/scans/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(data.scan);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
      inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current.click()}
        disabled={uploading}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {uploading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Parsing scan…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload scan
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
