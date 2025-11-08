import NotificationPanel from '../NotificationPanel';

export default function NotificationPanelExample() {
  return <NotificationPanel onClose={() => console.log('Panel closed')} />;
}
