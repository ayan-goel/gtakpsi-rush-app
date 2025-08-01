import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export const useCollaboration = (roomId, currentUser) => {
    const [socket, setSocket] = useState(null);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [remoteOperations, setRemoteOperations] = useState([]);
    const [remoteUpdates, setRemoteUpdates] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Map());
    const [documentState, setDocumentState] = useState({});
    
    const lastOperationRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const socketRef = useRef(null);

    const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';

    useEffect(() => {
        if (!roomId || !currentUser || !currentUser.id) {
            return;
        }

        if (socketRef.current) {
            return;
        }

        const connectSocket = () => {
            socketRef.current = io(WEBSOCKET_URL, {
                forceNew: true,
            });

            socketRef.current.on('connect', () => {
                setIsConnected(true);
                
                // Join the room
                socketRef.current.emit('join-room', {
                    roomId,
                    userId: currentUser.id,
                    userName: `${currentUser.firstName} ${currentUser.lastName}`,
                });
            });

            socketRef.current.on('disconnect', () => {
                setIsConnected(false);
                
                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (!socketRef.current?.connected) {
                        connectSocket();
                    }
                }, 3000);
            });

            socketRef.current.on('connect_error', (error) => {
                setIsConnected(false);
            });

            socketRef.current.on('users-updated', (users) => {
                setConnectedUsers(users.filter(user => user.id !== currentUser.id));
            });

            socketRef.current.on('text-operation', (operation) => {
                // Avoid processing our own operations
                if (operation.userId === currentUser?.id) {
                    return;
                }
                
                setRemoteOperations(prev => {
                    // Avoid duplicate operations
                    const exists = prev.some(op => op.id === operation.id);
                    if (exists) {
                        return prev;
                    }
                    
                    // Keep only the last 50 operations to prevent memory issues
                    const newOps = [...prev, operation];
                    return newOps.length > 50 ? newOps.slice(-50) : newOps;
                });
            });

            // handle full-text updates
            socketRef.current.on('text-update', (data) => {
                // ignore own updates
                if (data.userId === currentUser.id) return;
                setRemoteUpdates(prev => [...prev, data].slice(-100));
            });

            socketRef.current.on('cursor-position', (data) => {
                if (data.userId === currentUser.id) return;
                
                setConnectedUsers(prev => 
                    prev.map(user => 
                        user.id === data.userId 
                            ? { ...user, cursor: data.position, field: data.field }
                            : user
                    )
                );
            });

            socketRef.current.on('typing-indicator', (data) => {
                if (data.userId === currentUser.id) return;
                
                setTypingUsers(prev => {
                    const newMap = new Map(prev);
                    const key = `${data.userId}-${data.field}`;
                    
                    if (data.isTyping) {
                        newMap.set(key, {
                            userId: data.userId,
                            userName: data.userName,
                            field: data.field,
                            timestamp: Date.now()
                        });
                    } else {
                        newMap.delete(key);
                    }
                    return newMap;
                });
            });

            socketRef.current.on('document-state', (state) => {
                setDocumentState(state);
            });

            setSocket(socketRef.current);
        };

        connectSocket();

        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.removeAllListeners();
                socketRef.current = null;
            }
        };
    }, [roomId, currentUser, WEBSOCKET_URL]);

    const sendTextOperation = useCallback((operation) => {
        if (socket && isConnected) {
            // Store reference to avoid processing our own operation
            lastOperationRef.current = operation;
            socket.emit('text-operation', operation);
        }
    }, [socket, isConnected]);

    // Send full text update after debounce
    const sendTextUpdate = useCallback((field, value) => {
        if (socket && isConnected) {
            socket.emit('text-update', {
                field,
                value,
                userId: currentUser.id,
                userName: `${currentUser.firstName} ${currentUser.lastName}`
            });
        }
    }, [socket, isConnected, currentUser]);

    const sendCursorPosition = useCallback((field, position) => {
        if (socket && isConnected) {
            socket.emit('cursor-position', {
                field,
                position,
                timestamp: Date.now()
            });
        }
    }, [socket, isConnected]);

    const sendTypingIndicator = useCallback((field, isTyping) => {
        if (socket && isConnected) {
            socket.emit('typing-indicator', {
                field,
                isTyping,
                timestamp: Date.now()
            });
        }
    }, [socket, isConnected]);

    const requestDocumentState = useCallback(() => {
        if (socket && isConnected) {
            socket.emit('request-document-state');
        }
    }, [socket, isConnected]);

    // Clean up old typing indicators
    useEffect(() => {
        const interval = setInterval(() => {
            setTypingUsers(prev => {
                const now = Date.now();
                const filtered = new Map();
                for (const [key, value] of prev) {
                    if (now - value.timestamp < 3000) { // 3 second timeout
                        filtered.set(key, value);
                    }
                }
                return filtered;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return {
        isConnected,
        connectedUsers,
        remoteOperations,
        remoteUpdates,
        typingUsers: Array.from(typingUsers.values()),
        documentState,
        sendTextOperation,
        sendTextUpdate,
        sendCursorPosition,
        sendTypingIndicator,
        requestDocumentState,
    };
};

// Text operation utilities for Operational Transformation
export const applyOperation = (text, operation) => {
    const { type, position, content, length } = operation;
    
    switch (type) {
        case 'insert':
            return text.slice(0, position) + (content || '') + text.slice(position);
        case 'delete':
            return text.slice(0, position) + text.slice(position + (length || 0));
        case 'replace':
            return text.slice(0, position) + (content || '') + text.slice(position + (length || 0));
        default:
            return text;
    }
};

export const createOperation = (type, position, content = '', length = 0, field = '') => ({
    type,
    position,
    content,
    length,
    field,
    timestamp: Date.now(),
    id: Math.random().toString(36).substr(2, 9),
});

// Calculate the difference between two strings and create operations
export const createOperationsFromDiff = (oldText, newText, field) => {
    const operations = [];
    
    // Simple diff algorithm - find common prefix and suffix
    let prefixLength = 0;
    while (prefixLength < oldText.length && 
           prefixLength < newText.length && 
           oldText[prefixLength] === newText[prefixLength]) {
        prefixLength++;
    }
    
    let suffixLength = 0;
    while (suffixLength < (oldText.length - prefixLength) && 
           suffixLength < (newText.length - prefixLength) && 
           oldText[oldText.length - 1 - suffixLength] === newText[newText.length - 1 - suffixLength]) {
        suffixLength++;
    }
    
    const oldMiddle = oldText.slice(prefixLength, oldText.length - suffixLength);
    const newMiddle = newText.slice(prefixLength, newText.length - suffixLength);
    
    if (oldMiddle.length > 0) {
        // Delete operation
        operations.push(createOperation('delete', prefixLength, '', oldMiddle.length, field));
    }
    
    if (newMiddle.length > 0) {
        // Insert operation
        operations.push(createOperation('insert', prefixLength, newMiddle, 0, field));
    }
    
    return operations;
}; 