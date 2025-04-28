// Este arquivo é apenas um redirecionamento para a página principal
import { redirect } from 'next/navigation';

export default function Index() {
  redirect('/app');
}
