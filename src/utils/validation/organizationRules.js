// src/utils/validation/organizationRules.js

export const validateOrganization = (form) => {
  const errors = {};

  // Name (required, max length)
  if (!form.name?.trim()) {
    errors.name = 'Name is required.';
  } else if (form.name.length > 100) {
    errors.name = 'Name cannot exceed 100 characters.';
  }

  // Description (optional, max length)
  if (form.description?.length > 255) {
    errors.description = 'Description cannot exceed 255 characters.';
  }

  // Type (required)
  if (!form.type) {
    errors.type = 'Type is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
