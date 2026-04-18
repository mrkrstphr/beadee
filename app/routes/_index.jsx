import { redirect } from 'react-router';

export function loader() {
  return redirect('/list');
}

export default function Index() {
  return null;
}
