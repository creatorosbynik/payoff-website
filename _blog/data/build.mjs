export default function () {
  const now = new Date();
  return { year: now.getFullYear(), version: now.getTime().toString(36), date: now };
}
