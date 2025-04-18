import React from 'react';
import { Button } from '@/components/ui/Button';
import { UI_TEXTS } from '../constants';
import { WelcomeScreenData } from '../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: WelcomeScreenData;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  formData
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        {/* Cabecera */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <h3 className="text-xl font-semibold text-neutral-900">
            {UI_TEXTS.MODAL.SAVE_CONFIRM_TITLE}
          </h3>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-neutral-700">
            {UI_TEXTS.MODAL.SAVE_CONFIRM_MESSAGE}
          </p>

          {/* Estado de la pantalla */}
          <div className="bg-neutral-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-neutral-900">
              {UI_TEXTS.MODAL.SCREEN_STATUS}
            </h4>
            <p className="text-sm text-neutral-600">
              {formData.isEnabled ? UI_TEXTS.MODAL.SCREEN_ENABLED : UI_TEXTS.MODAL.SCREEN_DISABLED}
            </p>
          </div>

          {/* Contenido de la pantalla */}
          <div className="bg-neutral-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-neutral-900">
              {UI_TEXTS.MODAL.CONTENT}
            </h4>
            
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-neutral-700">
                  {UI_TEXTS.MODAL.TITLE_SECTION}:
                </span>
                <p className="text-sm text-neutral-600">
                  {formData.title || UI_TEXTS.MODAL.NO_TITLE}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium text-neutral-700">
                  {UI_TEXTS.MODAL.MESSAGE_SECTION}:
                </span>
                <p className="text-sm text-neutral-600">
                  {formData.message || UI_TEXTS.MODAL.NO_MESSAGE}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium text-neutral-700">
                  {UI_TEXTS.MODAL.BUTTON_TEXT_SECTION}:
                </span>
                <p className="text-sm text-neutral-600">
                  {formData.startButtonText || UI_TEXTS.MODAL.NO_BUTTON_TEXT}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex justify-end space-x-3">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            {UI_TEXTS.BUTTONS.CANCEL}
          </Button>
          <Button
            onClick={onConfirm}
          >
            {UI_TEXTS.BUTTONS.CONFIRM_SAVE}
          </Button>
        </div>
      </div>
    </div>
  );
}; 