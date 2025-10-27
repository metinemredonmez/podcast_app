import { ReactNode } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: Props) => {
  if (!isOpen) return null;
  return (
    <div className="modal">
      <div className="modal__content">
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    </div>
  );
};
