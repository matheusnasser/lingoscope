import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "../../components/layout/HomeHeader";
import HomeTabsNavigator from "../../navigation/HomeTabsNavigator";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-offWhite" edges={[]}>
      <View className="flex-1">
        <HomeHeader />
        <View className="flex-1">
          <HomeTabsNavigator />
        </View>
      </View>
    </SafeAreaView>
  );
}
