
import React, { useState, useRef } from 'react';

interface Props {
    value: string; // The current image URL (if any)
    onChange: (url: string) => void;
    label?: string;
}

export default function ImageUploader({ value, onChange, label = 'Foto / Gambar' }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation (Client Side)
        if (file.size > 2 * 1024 * 1024) {
            setError('Ukuran file maksimal 2MB.');
            return;
        }
        if (!file.type.startsWith('image/')) {
            setError('Hanya file gambar yang diizinkan.');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Upload failed');
            }

            const data = await res.json();
            if (data.success) {
                onChange(data.url); // Send back the URL to parent
            } else {
                throw new Error('Upload success flag missing');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Gagal mengupload gambar.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        onChange(''); // Clear value
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            <div className="flex flex-col gap-4">
                {/* Preview Area */}
                {value ? (
                    <div className="relative group w-full max-w-sm rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-gray-50">
                        <img src={value} alt="Preview" className="w-full h-48 object-cover" />

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                                href={value}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 text-xs font-semibold"
                            >
                                Lihat
                            </a>
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-semibold"
                            >
                                Hapus
                            </button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur px-3 py-1 text-xs text-gray-500 truncate">
                            {value}
                        </div>
                    </div>
                ) : (
                    // Upload Placeholder
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary hover:bg-blue-50/50'}`}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        ) : (
                            <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        )}
                        <span className="text-sm font-medium text-gray-600">
                            {loading ? 'Mengupload...' : 'Klik untuk Upload Gambar'}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">Maksimal 2 MB (JPG, PNG, WEBP)</span>
                    </div>
                )}

                {/* Hidden Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                />

                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        </div>
    );
}
