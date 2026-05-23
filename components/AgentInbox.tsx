'use client';
export function AgentInbox({ initialMessages, email }: { initialMessages: any[]; email: string }) {
  return (
    <section className="card">
      <h2 className="font-bold mb-3">Inbox for {email}</h2>
      {initialMessages.length === 0 && <p className="text-zinc-500 text-sm">No messages yet. Hit "Send pre-game briefing" above.</p>}
      <ul className="space-y-3">
        {initialMessages.map((m: any) => (
          <li key={m.id} className="border border-edge rounded-lg p-3">
            <div className="flex items-center justify-between">
              <p className="font-bold">{m.subject}</p>
              <span className="text-xs text-zinc-500">{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <p className="text-zinc-300 text-sm whitespace-pre-wrap mt-1">{m.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
