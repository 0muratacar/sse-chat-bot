import { ChatLayout } from '@/components/chat/ChatLayout';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <ChatLayout>{children}</ChatLayout>;
}
