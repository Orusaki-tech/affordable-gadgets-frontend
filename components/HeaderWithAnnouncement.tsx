import { Header } from '@/components/Header';
import { AnnouncementBar, type AnnouncementBarProps } from '@/components/AnnouncementBar';

export function HeaderWithAnnouncement(props?: Partial<AnnouncementBarProps>) {
  return (
    <div className="site-header-wrapper">
      <AnnouncementBar {...props} />
      <Header />
    </div>
  );
}
