import { toast } from 'sonner';
import i18n from '../i18n';

/**
 * Get localized message based on current language
 */
export const getLocalizedMessage = (arMessage: string, enMessage: string): string => {
  const lang = i18n.language.split('-')[0];
  return lang === 'ar' ? arMessage : enMessage;
};

/**
 * Show localized success toast
 */
export const toastSuccess = (arMessage: string, enMessage: string) => {
  toast.success(getLocalizedMessage(arMessage, enMessage));
};

/**
 * Show localized error toast
 */
export const toastError = (arMessage: string, enMessage: string) => {
  toast.error(getLocalizedMessage(arMessage, enMessage));
};

/**
 * Show localized info toast
 */
export const toastInfo = (arMessage: string, enMessage: string) => {
  toast.info(getLocalizedMessage(arMessage, enMessage));
};

/**
 * Show localized warning toast
 */
export const toastWarning = (arMessage: string, enMessage: string) => {
  toast.warning(getLocalizedMessage(arMessage, enMessage));
};

/**
 * Show localized confirm dialog
 */
export const confirmDialog = (arMessage: string, enMessage: string): boolean => {
  return window.confirm(getLocalizedMessage(arMessage, enMessage));
};

/**
 * Show localized alert
 */
export const alertDialog = (arMessage: string, enMessage: string): void => {
  window.alert(getLocalizedMessage(arMessage, enMessage));
};
