export function validatePerson(data) {
  const errors = {};
  const currentYear = new Date().getFullYear();

  // name
  if (!data.name || data.name.trim() === "") {
    errors.name = "Name is required.";
  }

  // birth_year
  if (data.birth_year !== null && data.birth_year !== "" && data.birth_year !== undefined) {
    const year = Number(data.birth_year);
    if (isNaN(year) || year < 1900 || year > currentYear) {
      errors.birth_year = `Birth year must be between 1900 and ${currentYear}.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
