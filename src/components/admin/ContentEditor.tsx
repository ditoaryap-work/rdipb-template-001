import React, { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';

interface Props {
    apiPath: string;
    title: string;
}

// Helpers
const formatLabel = (key: string) => {
    return key
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, c => c.toUpperCase());
};

const getFieldType = (key: string, value: any) => {
    const k = key.toLowerCase();
    if (k.includes('image') || k.includes('photo') || k.includes('cover') || k.includes('icon') || k.includes('bg')) {
        return 'image';
    }
    if (typeof value === 'string' && value.length > 80) return 'textarea';
    if (k.includes('description') || k.includes('mapembed')) return 'textarea';
    if (typeof value === 'number') return 'number';
    return 'text';
};

// Field Renderer Component
const FieldRenderer = ({
    data,
    path = [],
    onChange,
    level = 0
}: {
    data: any,
    path: (string | number)[],
    onChange: (path: (string | number)[], value: any) => void,
    level?: number
}) => {

    // Array handling
    if (Array.isArray(data)) {
        const isPrimitiveArray = data.length > 0 && typeof data[0] !== 'object';

        return (
            <div className="space-y-3">
                {data.map((item, idx) => (
                    <div key={idx} className="relative group">
                        {/* Delete button */}
                        <button
                            type="button"
                            onClick={() => {
                                const newArr = [...data];
                                newArr.splice(idx, 1);
                                onChange(path, newArr);
                            }}
                            className="absolute right-2 top-2 w-6 h-6 bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-md text-xs opacity-0 group-hover:opacity-100 transition-all z-10 flex items-center justify-center"
                            title="Hapus"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {isPrimitiveArray ? (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-400 w-6 text-center">{idx + 1}</span>
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    value={item}
                                    onChange={(e) => {
                                        const newArr = [...data];
                                        newArr[idx] = e.target.value;
                                        onChange(path, newArr);
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-6 h-6 bg-gray-200 text-gray-600 rounded-md flex items-center justify-center text-xs font-medium">{idx + 1}</span>
                                </div>
                                <FieldRenderer
                                    data={item}
                                    path={[...path, idx]}
                                    onChange={onChange}
                                    level={level + 1}
                                />
                            </div>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() => {
                        let template: any = "";
                        if (!isPrimitiveArray && data.length > 0) {
                            template = JSON.parse(JSON.stringify(data[0]));
                            Object.keys(template).forEach(k => template[k] = "");
                        } else if (!isPrimitiveArray) {
                            template = {};
                        }
                        onChange(path, [...data, template]);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Tambah Item
                </button>
            </div>
        );
    }

    // Object handling
    if (typeof data === 'object' && data !== null) {
        return (
            <div className="space-y-5">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {formatLabel(key)}
                        </label>
                        <FieldRenderer
                            data={value}
                            path={[...path, key]}
                            onChange={onChange}
                            level={level + 1}
                        />
                    </div>
                ))}
            </div>
        );
    }

    // Primitive handling
    const currentPathKey = path[path.length - 1] as string;
    const type = getFieldType(currentPathKey, data);

    if (type === 'image') {
        return (
            <ImageUploader
                label=""
                value={data}
                onChange={(url) => onChange(path, url)}
            />
        );
    }

    if (type === 'textarea') {
        return (
            <textarea
                rows={4}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none transition-all"
                value={data}
                onChange={(e) => onChange(path, e.target.value)}
            />
        );
    }

    return (
        <input
            type={type === 'number' ? 'number' : 'text'}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            value={data}
            onChange={(e) => onChange(path, e.target.value)}
        />
    );
};

// Main Component
export default function ContentEditor({ apiPath, title }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchContent();
    }, [apiPath]);

    const fetchContent = async () => {
        try {
            const res = await fetch(`/api/content/${apiPath}`);
            if (!res.ok) throw new Error('Failed to load');
            const json = await res.json();
            setData(json);
        } catch (e) {
            setToast({ msg: 'Gagal memuat data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeepChange = (path: (string | number)[], value: any) => {
        setData((prev: any) => {
            const newData = JSON.parse(JSON.stringify(prev));
            let current = newData;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newData;
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/content/${apiPath}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save');
            setToast({ msg: 'Tersimpan!', type: 'success' });
        } catch (e) {
            setToast({ msg: 'Gagal menyimpan', type: 'error' });
        } finally {
            setSaving(false);
            setTimeout(() => setToast(null), 2500);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Memuat...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            Simpan
                        </>
                    )}
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.type === 'success' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                    {toast.msg}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6">
                <FieldRenderer data={data} path={[]} onChange={handleDeepChange} />
            </form>
        </div>
    );
}
