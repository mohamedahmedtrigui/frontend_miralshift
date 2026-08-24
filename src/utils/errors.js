// Laravel returns 422 responses as { message, errors: { field: [msg, ...] } }.
// Surface the field-level detail when present instead of the generic message.
export const getErrorMessage = (error, fallback = 'Une erreur est survenue') => {
  const data = error?.response?.data;
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }
  return data?.message || fallback;
};
