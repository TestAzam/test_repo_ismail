import { VALIDATION_RULES } from './constants';

// Base validation function
const createValidator = (validationFn, errorMessage) => {
  return (value) => {
    if (validationFn(value)) {
      return null;
    }
    return errorMessage;
  };
};

// Required field validator
export const required = (message = 'Это поле обязательно для заполнения') => {
  return createValidator(
    (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message
  );
};

// Minimum length validator
export const minLength = (min, message) => {
  const defaultMessage = `Минимальная длина: ${min} символов`;
  return createValidator(
    (value) => !value || value.length >= min,
    message || defaultMessage
  );
};

// Maximum length validator
export const maxLength = (max, message) => {
  const defaultMessage = `Максимальная длина: ${max} символов`;
  return createValidator(
    (value) => !value || value.length <= max,
    message || defaultMessage
  );
};

// Email validator
export const email = (message = 'Введите корректный email адрес') => {
  return createValidator(
    (value) => !value || VALIDATION_RULES.email.test(value),
    message
  );
};

// Password validator
export const password = (options = {}) => {
  const {
    minLength: minLen = VALIDATION_RULES.password.minLength,
    requireUppercase = VALIDATION_RULES.password.requireUppercase,
    requireLowercase = VALIDATION_RULES.password.requireLowercase,
    requireNumbers = VALIDATION_RULES.password.requireNumbers,
    requireSpecialChars = VALIDATION_RULES.password.requireSpecialChars
  } = options;

  return (value) => {
    if (!value) return null;

    if (value.length < minLen) {
      return `Пароль должен содержать минимум ${minLen} символов`;
    }

    if (requireUppercase && !/[A-Z]/.test(value)) {
      return 'Пароль должен содержать заглавные буквы';
    }

    if (requireLowercase && !/[a-z]/.test(value)) {
      return 'Пароль должен содержать строчные буквы';
    }

    if (requireNumbers && !/\d/.test(value)) {
      return 'Пароль должен содержать цифры';
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return 'Пароль должен содержать специальные символы';
    }

    return null;
  };
};

// Phone validator
export const phone = (message = 'Введите корректный номер телефона') => {
  return createValidator(
    (value) => !value || VALIDATION_RULES.phone.test(value.replace(/\D/g, '')),
    message
  );
};

// INN validator
export const inn = (message = 'ИНН должен содержать 10 или 12 цифр') => {
  return createValidator(
    (value) => !value || VALIDATION_RULES.inn.test(value.replace(/\D/g, '')),
    message
  );
};

// Number validator
export const number = (message = 'Введите корректное число') => {
  return createValidator(
    (value) => value === '' || value === null || value === undefined || !isNaN(Number(value)),
    message
  );
};

// Positive number validator
export const positiveNumber = (message = 'Число должно быть положительным') => {
  return createValidator(
    (value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = Number(value);
      return !isNaN(num) && num > 0;
    },
    message
  );
};

// Integer validator
export const integer = (message = 'Введите целое число') => {
  return createValidator(
    (value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = Number(value);
      return !isNaN(num) && Number.isInteger(num);
    },
    message
  );
};

// Range validator
export const range = (min, max, message) => {
  const defaultMessage = `Значение должно быть от ${min} до ${max}`;
  return createValidator(
    (value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = Number(value);
      return !isNaN(num) && num >= min && num <= max;
    },
    message || defaultMessage
  );
};

// Date validator
export const date = (message = 'Введите корректную дату') => {
  return createValidator(
    (value) => {
      if (!value) return true;
      const dateObj = new Date(value);
      return !isNaN(dateObj.getTime());
    },
    message
  );
};

// Future date validator
export const futureDate = (message = 'Дата должна быть в будущем') => {
  return createValidator(
    (value) => {
      if (!value) return true;
      const dateObj = new Date(value);
      const now = new Date();
      return dateObj > now;
    },
    message
  );
};

// Past date validator
export const pastDate = (message = 'Дата должна быть в прошлом') => {
  return createValidator(
    (value) => {
      if (!value) return true;
      const dateObj = new Date(value);
      const now = new Date();
      return dateObj < now;
    },
    message
  );
};

// URL validator
export const url = (message = 'Введите корректный URL') => {
  return createValidator(
    (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  );
};

// Pattern validator
export const pattern = (regex, message = 'Неверный формат') => {
  return createValidator(
    (value) => !value || regex.test(value),
    message
  );
};

// Custom validator
export const custom = (validationFn, message = 'Неверное значение') => {
  return createValidator(validationFn, message);
};

// Confirm password validator
export const confirmPassword = (originalPassword, message = 'Пароли не совпадают') => {
  return createValidator(
    (value) => !value || value === originalPassword,
    message
  );
};

// File size validator
export const fileSize = (maxSizeInBytes, message) => {
  const defaultMessage = `Размер файла не должен превышать ${Math.round(maxSizeInBytes / 1024 / 1024)} МБ`;
  return createValidator(
    (file) => {
      if (!file || !file.size) return true;
      return file.size <= maxSizeInBytes;
    },
    message || defaultMessage
  );
};

// File type validator
export const fileType = (allowedTypes, message = 'Неподдерживаемый тип файла') => {
  return createValidator(
    (file) => {
      if (!file || !file.type) return true;
      return allowedTypes.includes(file.type);
    },
    message
  );
};

// Inventory number validator
export const inventoryNumber = (message = 'Неверный формат инвентарного номера') => {
  return createValidator(
    (value) => !value || VALIDATION_RULES.inventoryNumber.test(value),
    message
  );
};

// Combine multiple validators
export const combine = (...validators) => {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
};

// Validate form data
export const validateForm = (data, validationSchema) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationSchema).forEach(field => {
    const validators = validationSchema[field];
    const value = data[field];

    if (Array.isArray(validators)) {
      // Multiple validators
      for (const validator of validators) {
        const error = validator(value);
        if (error) {
          errors[field] = error;
          isValid = false;
          break;
        }
      }
    } else {
      // Single validator
      const error = validators(value);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }
  });

  return { isValid, errors };
};

// Async validator wrapper
export const async = (asyncValidationFn, message = 'Ошибка валидации') => {
  return async (value) => {
    try {
      const isValid = await asyncValidationFn(value);
      return isValid ? null : message;
    } catch (error) {
      return message;
    }
  };
};

// Debounced validator for real-time validation
export const debounced = (validator, delay = 300) => {
  let timeoutId;
  
  return (value, callback) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const error = validator(value);
      callback(error);
    }, delay);
  };
};

// Export all validators as default object
export default {
  required,
  minLength,
  maxLength,
  email,
  password,
  phone,
  inn,
  number,
  positiveNumber,
  integer,
  range,
  date,
  futureDate,
  pastDate,
  url,
  pattern,
  custom,
  confirmPassword,
  fileSize,
  fileType,
  inventoryNumber,
  combine,
  validateForm,
  async,
  debounced
};