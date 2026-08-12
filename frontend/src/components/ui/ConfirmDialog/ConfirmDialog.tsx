import React from 'react';
import { MdWarning } from 'react-icons/md';
import { Modal } from '../Modal/Modal';
import { Button, type ButtonVariant } from '../Button/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title = 'Confirm Action',
  message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', loading,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <span style={{
          fontSize: 32,
          color: variant === 'danger' ? 'var(--color-error)' : 'var(--color-warning)',
          flexShrink: 0,
        }}>
          <MdWarning />
        </span>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
      </div>
    </Modal>
  );
}
