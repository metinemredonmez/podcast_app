import { ReactNode } from "react";

export const Card = ({ children }: { children?: ReactNode }) => {
  return <div className="card">{children}</div>;
};
