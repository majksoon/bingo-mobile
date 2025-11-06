import { Provider as PaperProvider } from "react-native-paper";
import RootNavigator from "../../src/navigation/RootNavigator";

export default function HomeScreen() {
  return (
    <PaperProvider>
      <RootNavigator />
    </PaperProvider>
  );
}
