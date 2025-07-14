import React from 'react';
import { FaExclamationTriangle, FaUser, FaComment } from 'react-icons/fa';

const CommentWarning = ({ warnings, onDismiss }) => {
    if (!warnings || warnings.length === 0) {
        return null;
    }

    const getIcon = (type) => {
        switch (type) {
            case 'speculative':
                return <FaComment className="text-yellow-400" />;
            case 'name':
                return <FaUser className="text-red-400" />;
            default:
                return <FaExclamationTriangle className="text-orange-400" />;
        }
    };

    const getWarningClass = (type) => {
        switch (type) {
            case 'speculative':
                return 'border-yellow-500 bg-yellow-900/20';
            case 'name':
                return 'border-red-500 bg-red-900/20';
            default:
                return 'border-orange-500 bg-orange-900/20';
        }
    };

    return (
        <div className="mb-4 space-y-2">
            {warnings.map((warning, index) => (
                <div
                    key={index}
                    className={`flex items-start p-3 rounded-lg border ${getWarningClass(warning.type)}`}
                >
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                        {getIcon(warning.type)}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-200">
                            {warning.message}
                        </p>
                    </div>
                    {onDismiss && (
                        <button
                            onClick={() => onDismiss(index)}
                            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-200"
                        >
                            ×
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CommentWarning; 