import { InputHTMLAttributes } from 'react';
import './Input.styles';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = ({ label, ...props }: Props) => {
  return (
    <label className="input">
      {label && <span>{label}</span>}
      <input {...props} />
    </label>
  );
};
