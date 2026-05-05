/* ============================================
   MOCK DATA — Smart Life Inbox
   Realistic task/briefing data for the UI
   ============================================ */

export interface Task {
  id: string;
  title: string;
  dueTime: string;
  category: string;
  priority: 'urgent' | 'today' | 'later';
  completed: boolean;
}

export interface AISuggestion {
  id: string;
  text: string;
  type: 'action' | 'reminder' | 'insight';
}

export interface RecentUpload {
  id: string;
  filename: string;
  type: 'pdf' | 'image' | 'audio' | 'text';
  date: string;
  status: 'processed' | 'processing' | 'pending';
}

export const tasks: Task[] = [
  { id: '1', title: 'Pay electricity bill — overdue 3 days', dueTime: 'OVERDUE', category: 'BILLS', priority: 'urgent', completed: false },
  { id: '2', title: 'Renew car insurance before Friday', dueTime: '2 DAYS LEFT', category: 'INSURANCE', priority: 'urgent', completed: false },
  { id: '3', title: 'Schedule dentist appointment', dueTime: '10:00 AM', category: 'HEALTH', priority: 'today', completed: false },
  { id: '4', title: 'Submit tax documents to accountant', dueTime: '2:00 PM', category: 'FINANCE', priority: 'today', completed: true },
  { id: '5', title: 'Buy groceries for the week', dueTime: '5:00 PM', category: 'ERRANDS', priority: 'today', completed: false },
  { id: '6', title: 'Research new broadband providers', dueTime: 'THIS WEEK', category: 'HOME', priority: 'later', completed: false },
  { id: '7', title: 'Update emergency contacts list', dueTime: 'THIS WEEK', category: 'ADMIN', priority: 'later', completed: false },
  { id: '8', title: 'Clean out garage storage unit', dueTime: 'NEXT WEEK', category: 'HOME', priority: 'later', completed: false },
];

export const aiSuggestions: AISuggestion[] = [
  { id: '1', text: 'Your electricity bill has a late fee accumulating. Pay within 24 hours to avoid additional charges.', type: 'action' },
  { id: '2', text: 'Based on your calendar, Wednesday 2PM is free for the dentist appointment.', type: 'reminder' },
  { id: '3', text: 'You spent 23% more on groceries last month. Consider using the list from 2 weeks ago as a baseline.', type: 'insight' },
];

export const dailyBriefing = {
  greeting: 'Good morning.',
  summary: 'You have 3 tasks due today, 1 overdue bill, and a dentist appointment to schedule. Your car insurance expires in 2 days.',
  urgentCount: 2,
  todayCount: 3,
  laterCount: 3,
};

export const recentUploads: RecentUpload[] = [
  { id: '1', filename: 'electricity_bill_march.pdf', type: 'pdf', date: '2 hours ago', status: 'processed' },
  { id: '2', filename: 'insurance_renewal_notice.pdf', type: 'pdf', date: '1 day ago', status: 'processed' },
  { id: '3', filename: 'grocery_receipt.jpg', type: 'image', date: '2 days ago', status: 'processing' },
];

export const supportedFormats = [
  { label: 'PDF', color: 'bg-brutal-coral', desc: 'Bills, documents, contracts' },
  { label: 'IMAGE', color: 'bg-brutal-purple', desc: 'Receipts, photos, screenshots' },
  { label: 'AUDIO', color: 'bg-brutal-lavender', desc: 'Voice memos, recordings' },
  { label: 'TEXT', color: 'bg-brutal-lime', desc: 'Notes, emails, messages' },
];
