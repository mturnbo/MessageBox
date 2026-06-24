import { Dialog } from 'primereact/dialog';

const avatar = (name) => (name?.[0] ?? '?').toUpperCase();

const MessageViewModal = ({ message, onClose }) => {
  if (!message) return null;

  const header = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
        {avatar(message.senderName)}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-800 truncate">{message.senderName ?? 'Unknown'}</p>
        <p className="text-xs text-gray-500">{new Date(message.sentAt).toLocaleString()}</p>
      </div>
      <span
        className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
          message.readAt ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
        }`}
      >
        {message.readAt ? 'Read' : 'Unread'}
      </span>
    </div>
  );

  return (
    <Dialog
      header={header}
      visible
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{ width: '560px' }}
    >
      <div className="flex flex-col gap-4 pt-1">
        {message.subject && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Subject</p>
            <p className="font-medium text-gray-800">{message.subject}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Message</p>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{message.body ?? '(no body)'}</p>
        </div>
      </div>
    </Dialog>
  );
};

export default MessageViewModal;
