import Link from "next/link";

type Conversation = {
  id: string;
  name: string;
  status: string;
  unread: number;
};

export default function ConversationSidebar({
  conversations,
  currentId,
}: {
  conversations: Conversation[];
  currentId: string;
}) {
  return (
    <aside className="w-full border-r border-white/10 lg:w-80">
      <div className="border-b border-white/10 p-5">
        <h2 className="text-2xl font-black">Messages</h2>
        <p className="mt-1 text-sm text-white/50">
          Your Qnect conversations
        </p>
      </div>

      <div className="p-3">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className={
              currentId === conversation.id
                ? "mb-2 flex items-center justify-between rounded-2xl bg-violet-600/20 p-4"
                : "mb-2 flex items-center justify-between rounded-2xl p-4 hover:bg-white/5"
            }
          >
            <div className="flex items-center gap-3">
              <div
                className={
                  conversation.status === "Online"
                    ? "h-3 w-3 rounded-full bg-green-500"
                    : "h-3 w-3 rounded-full bg-yellow-500"
                }
              />

              <div>
                <p className="font-bold">{conversation.name}</p>
                <p className="text-xs text-white/40">
                  {conversation.status}
                </p>
              </div>
            </div>

            {conversation.unread > 0 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold">
                {conversation.unread}
              </div>
            )}
          </Link>
        ))}
      </div>
    </aside>
  );
}