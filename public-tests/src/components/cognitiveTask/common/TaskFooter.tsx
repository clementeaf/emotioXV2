import React from 'react';

interface TaskFooterProps {
  className?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  caPrivacyNoticeUrl?: string;
}

const TaskFooter: React.FC<TaskFooterProps> = ({
  className = 'w-full text-xs text-neutral-500 mt-8 flex justify-between', // Clases originales
  privacyPolicyUrl = '#',
  termsUrl = '#',
  caPrivacyNoticeUrl = '#',
}) => {
  return (
    <div className={className}>
      <div>
        This site is protected by reCAPTCHA and the Google{' '}
        <a href={privacyPolicyUrl} className="text-indigo-600 hover:text-indigo-700">
          Privacy Policy
        </a>
      </div>
      <div className="flex gap-4">
        <a href={termsUrl} className="text-neutral-600 hover:text-neutral-800">
          Terms and Conditions
        </a>
        <a href={privacyPolicyUrl} className="text-neutral-600 hover:text-neutral-800">
          Privacy Policy
        </a>
        <a href={caPrivacyNoticeUrl} className="text-neutral-600 hover:text-neutral-800">
          CA Privacy Notice
        </a>
      </div>
    </div>
  );
};

export default TaskFooter; 