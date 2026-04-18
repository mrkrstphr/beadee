import { useOutletContext } from 'react-router';
import SettingsView from '../../src/views/SettingsView.jsx';

export default function SettingsRoute() {
  const { theme, onThemeChange } = useOutletContext();

  return <SettingsView theme={theme} onThemeChange={onThemeChange} />;
}
