import { View } from "react-native";

import {UsageCard} from "./usage-card/UsageCard";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: '100%',
        padding: 10,
      }}
    >
        <UsageCard />
    </View>
  );
}
