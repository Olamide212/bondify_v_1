/**
 * Computes age from a profile object, checking age, dateOfBirth, and birthdate fields.
 * @param {object} profile - The user profile object
 * @returns {number|null} - The computed age or null
 */
export const getProfileAge = (profile) => {
  if (profile?.age) return profile.age;

  const dob = profile?.dateOfBirth || profile?.birthdate;
  if (!dob) return null;

  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let years = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    years -= 1;
  }
  return years;
};
