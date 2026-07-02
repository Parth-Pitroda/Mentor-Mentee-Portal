import { Award, Bell, BookOpen, CalendarClock } from "lucide-react";
import {
  respondToMeetingRequest,
  updateAcademicStatus,
  updateAchievementStatus,
  updateMeetingStatus,
} from "@/lib/actions/student.actions";
import ActionButton from "./ActionButton";
import ApprovalCard from "./ApprovalCard";
import Queue from "./Queue";

export default function ApprovalQueue({ activeTab, pending }: { activeTab: string; pending: any }) {
  const refresh = () => window.dispatchEvent(new CustomEvent("app:refresh"));

  if (activeTab === "requests") {
    return <Queue records={pending.meetingRequests} empty="No meeting requests awaiting confirmation." render={(request: any) => (
      <ApprovalCard key={request.$id} icon={<CalendarClock />} title={request.studentName || "Meeting request"} meta={`${request.proposedDate || request.date || "N/A"} ${request.proposedTime || ""}`} body={request.agenda || request.description}>
        <ActionButton onClick={async () => { await respondToMeetingRequest(request.$id, "Confirmed"); refresh(); }} label="Accept" />
        <ActionButton onClick={async () => { await respondToMeetingRequest(request.$id, "Rejected"); refresh(); }} label="Reject" danger />
      </ApprovalCard>
    )} />;
  }

  if (activeTab === "academics") {
    return <Queue records={pending.academics} empty="No academic records awaiting review." render={(record: any) => (
      <ApprovalCard key={record.$id} icon={<BookOpen />} title={record.studentName || "Academic record"} meta={`Semester ${record.semester || "N/A"}`} body={`SPI ${record.spi || "-"} / CPI ${record.cpi || "-"}`} fileId={record.documentId || record.fileId}>
        <ActionButton onClick={async () => { await updateAcademicStatus(record.$id, "Verified", record.studentId); refresh(); }} label="Verify" />
        <ActionButton onClick={async () => { await updateAcademicStatus(record.$id, "Rejected", record.studentId); refresh(); }} label="Reject" danger />
      </ApprovalCard>
    )} />;
  }

  if (activeTab === "achievements") {
    return <Queue records={pending.achievements} empty="No achievements awaiting review." render={(record: any) => (
      <ApprovalCard key={record.$id} icon={<Award />} title={record.title || "Achievement"} meta={record.studentName || record.category || ""} body={record.description} fileId={record.documentId || record.fileId}>
        <ActionButton onClick={async () => { await updateAchievementStatus(record.$id, "Verified", record.studentId); refresh(); }} label="Verify" />
        <ActionButton onClick={async () => { await updateAchievementStatus(record.$id, "Rejected", record.studentId); refresh(); }} label="Reject" danger />
      </ApprovalCard>
    )} />;
  }

  return <Queue records={pending.meetings} empty="No meeting logs awaiting review." render={(record: any) => (
    <ApprovalCard key={record.$id} icon={<Bell />} title={record.topic || "Meeting log"} meta={record.studentName || record.date || ""} body={record.description}>
      <ActionButton onClick={async () => { await updateMeetingStatus(record.$id, "Verified", record.studentId); refresh(); }} label="Verify" />
      <ActionButton onClick={async () => { await updateMeetingStatus(record.$id, "Rejected", record.studentId); refresh(); }} label="Reject" danger />
    </ApprovalCard>
  )} />;
}
