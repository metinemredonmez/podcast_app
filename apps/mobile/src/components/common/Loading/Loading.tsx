import { ActivityIndicator, View } from "react-native";

export const Loading = () => (
  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
    <ActivityIndicator size="large" />
  </View>
);
