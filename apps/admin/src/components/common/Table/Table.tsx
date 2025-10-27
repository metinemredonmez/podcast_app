import { ReactNode } from 'react';

export const Table = ({ children }: { children: ReactNode }) => {
  return <table className="table">{children}</table>;
};
