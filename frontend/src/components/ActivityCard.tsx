export default function ActivityCard({ activity }: { activity: any[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-800">System Activity</h3>
      {activity.length === 0 ? (
        <p className="text-sm text-slate-400">No recent activity.</p>
      ) : (
        <div className="space-y-3">
          {activity.slice(0, 8).map((item, index) => (
            <p key={item.$id || index} className="rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-600">
              {item.message || item.action || JSON.stringify(item)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
