import React from 'react';

interface Props {
    onClose: () => void;
    children: React.ReactNode;
    zIndex?: string;
    maxWidth?: string;
}

export const BaseModal: React.FC<Props> = ({
    onClose,
    children,
    zIndex = 'z-50',
    maxWidth = 'max-w-2xl',
}) => (
    <div
        className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/80 backdrop-blur-sm`}
        style={{ padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)' }}
        onClick={onClose}
    >
        <div
            className={`w-full ${maxWidth} bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-200 m-3`}
            style={{ maxHeight: '92dvh' }}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);
