import { ReactNode } from "react";
import { View } from "react-native";

type Props = {
  children?: ReactNode;
  padding?: number;
};

export const Card = ({ children, padding = 16 }: Props) => (
  <View
    style={{
      padding,
      borderRadius: 12,
      backgroundColor: "#ffffff",
      shadowColor: "#000000",
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
      marginBottom: 12,
    }}
  >
    {children}
  </View>
);
