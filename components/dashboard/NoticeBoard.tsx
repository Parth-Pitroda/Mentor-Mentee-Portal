import { getLatestNotices } from "@/lib/actions/student.actions";

export default async function NoticeBoard() {
  const notices = await getLatestNotices();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-blue-50/50 rounded-t-xl">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          📢 Notice Board
        </h2>
        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold uppercase">
          Latest
        </span>
      </div>
      
      <div className="p-4 overflow-y-auto max-h-[400px] space-y-4">
        {notices.length === 0 ? (
          <p className="text-gray-400 text-center text-sm py-10 italic">No new announcements today.</p>
        ) : (
          notices.map((notice: any) => (
            <div key={notice.$id} className="border-l-4 border-blue-500 bg-gray-50 p-3 rounded-r-lg hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-900 text-sm">{notice.title}</h3>
                <span className="text-[10px] text-gray-400 uppercase font-bold">
                  {new Date(notice.$createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {notice.content}
              </p>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 border-t mt-auto text-center">
        <button className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">
          View All Notices →
        </button>
      </div>
    </div>
  );
}