import 'react-native-gesture-handler';
import { AppProvider } from '../context/AppContext';
import AppNavigator from '../navigation/AppNavigator';
import '../services/backgroundTaskService';

export default function App() {
  return (
    <AppProvider>
        <AppNavigator />
    </AppProvider>
  );
}