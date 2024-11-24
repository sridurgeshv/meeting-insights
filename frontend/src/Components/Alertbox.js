import React from 'react';

export const Alert = ({ children, variant = 'default' }) => {
  const alertStyles =
    variant === 'default'
      ? 'bg-green-100 border-green-400 text-green-700'
      : 'bg-red-100 border-red-400 text-red-700';

  return (
    <div className={`border-l-4 p-4 rounded-md shadow-sm ${alertStyles}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }) => (
  <div className="text-sm">{children}</div>
);

const Alertbox = () => {
  const showSaveNotification = true;
  const saveNotificationStatus = 'success';
  const saveNotificationMessage = 'Changes saved successfully!';

  return (
    <div>
      {showSaveNotification && (
        <div className="fixed top-4 right-4 z-50">
          <Alert variant={saveNotificationStatus === 'success' ? 'default' : 'destructive'}>
            <AlertDescription>{saveNotificationMessage}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default Alertbox;