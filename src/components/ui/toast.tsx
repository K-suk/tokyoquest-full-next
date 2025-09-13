"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface ToastProps {
    id: string;
    title: string;
    description?: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose: (id: string) => void;
    actions?: Array<{
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary';
    }>;
}

export function Toast({
    id,
    title,
    description,
    type = 'info',
    duration = 5000,
    onClose,
    actions = [],
}: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => onClose(id), 300); // Allow fade out animation
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
    };

    const typeStyles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    const actionStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    };

    return (
        <div
            className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        border rounded-lg shadow-lg p-4
        transition-all duration-300 ease-in-out
        ${typeStyles[type]}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h4 className="font-semibold text-sm">{title}</h4>
                    {description && (
                        <p className="text-sm mt-1 opacity-90">{description}</p>
                    )}
                    {actions.length > 0 && (
                        <div className="flex gap-2 mt-3">
                            {actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.onClick}
                                    className={`
                    px-3 py-1 text-xs font-medium rounded
                    transition-colors duration-200
                    ${actionStyles[action.variant || 'secondary']}
                  `}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleClose}
                    className="ml-2 p-1 rounded hover:bg-black/10 transition-colors duration-200"
                    aria-label="Close notification"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export interface ToastContainerProps {
    toasts: ToastProps[];
    onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={onClose} />
            ))}
        </div>
    );
}
