import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type} glass-panel`}
            onClick={() => removeToast(t.id)}
            style={{ cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined">
              {t.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span style={{ fontSize: '14px', fontFamily: 'var(--font-body)' }}>{t.message}</span>
            <span
              className="material-symbols-outlined"
              style={{ marginLeft: 'auto', fontSize: '18px', opacity: 0.6 }}
            >
              close
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
