import { ButtonHTMLAttributes } from 'react';
import './Button.styles';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export const Button = ({ label, ...props }: Props) => {
  return (
    <button className="btn" {...props}>
      {label}
    </button>
  );
};
