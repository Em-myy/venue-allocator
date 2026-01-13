import { FaExclamationTriangle } from "react-icons/fa";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isLoading?: boolean;
};

const ConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-red-50 px-6 py-6 flex flex-col items-center justify-center text-center border-b border-red-100">
          <div className="bg-red-100 p-3 rounded-full mb-3 text-red-600">
            <FaExclamationTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-2">{message}</p>
        </div>

        <div className="p-6 flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-md transition flex justify-center items-center
              ${
                isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
              }`}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
