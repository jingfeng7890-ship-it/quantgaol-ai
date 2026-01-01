'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-black text-white p-4">
            <h2 className="text-xl font-bold text-red-500 mb-4">Application Error</h2>
            <div className="bg-zinc-900 p-4 rounded border border-zinc-800 font-mono text-xs max-w-lg overflow-auto mb-6 text-zinc-300">
                {error.message || "Unknown error occurred"}
                {error.stack && <pre className="mt-2 opacity-50">{error.stack}</pre>}
            </div>
            <button
                onClick={() => reset()}
                className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-zinc-200"
            >
                Try again
            </button>
        </div>
    );
}
