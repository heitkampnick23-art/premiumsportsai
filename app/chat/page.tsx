import { readEmail } from '@/lib/auth';
import { getTier } from '@/lib/tier';
import { ChatPanel } from '@/components/ChatPanel';

export const runtime = 'edge';

export default async function ChatPage() {
  const email = await readEmail();
  const tier = await getTier(email);
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-black">AI Chat with your team</h1>
        <p className="text-zinc-400">Ask anything NFL — injuries, scheme, line value, history. Pick a team for grounded answers.</p>
      </header>
      <ChatPanel signedIn={!!email} tier={tier} />
    </div>
  );
}
