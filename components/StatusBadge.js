const STATUS_COLOR = {
  registered: 'gray',
  payment_verified: 'blue',
  checked_in: 'green',
  eval_pending: 'orange',
  ready_for_eval: 'purple',
  eval_completed: 'teal',
  project_submission_open: 'orange',
  project_submitted: 'darkgreen',
  registration: 'gray',
  live: 'green',
  closed: 'darkgreen',
};

const STATUS_LABEL = {
  registered: 'Registered',
  payment_verified: 'Payment Verified',
  checked_in: 'Checked In',
  eval_pending: 'Eval Pending',
  ready_for_eval: 'Ready',
  eval_completed: 'Eval Completed',
  project_submission_open: 'Submission Open',
  project_submitted: 'Submitted',
  registration: 'Registration',
  live: 'Live',
  closed: 'Closed',
};

export default function StatusBadge({ status }) {
  const tone = STATUS_COLOR[status] || 'gray';
  return <span className={`badge ${tone}`}>{STATUS_LABEL[status] || status || 'Unknown'}</span>;
}
