import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getCurrentUserNotificationState } from "@/lib/actions/student.actions";
import LoadingPage from "@/src/components/LoadingPage";

export default function NotificationsPage() {
  const state = useAsyncData(async () => getCurrentUserNotificationState(), []);
  const notifications = (state.data as any)?.notifications || [];

  if (state.loading) return <LoadingPage label="Loading notifications..." />;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <p className="p-10 text-center text-sm font-semibold text-slate-400">No notifications yet.</p>
        ) : (
          notifications.map((notification: any) => (
            <div key={notification.$id} className="p-5">
              <p className="font-bold text-slate-800">{notification.title || notification.type || "Notification"}</p>
              <p className="mt-1 text-sm text-slate-500">{notification.message || notification.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
