import { useOutletContext } from 'react-router';
import SettingsView from '../views/SettingsView.jsx';
import type { LayoutOutletContext } from './_layout.jsx';

export default function SettingsRoute() {
  const { theme, onThemeChange } = useOutletContext<LayoutOutletContext>();

  return <SettingsView theme={theme} onThemeChange={onThemeChange} />;
}
