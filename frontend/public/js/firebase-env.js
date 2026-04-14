export async function getFirebaseConfig() {
  const response = await fetch('/api/firebase-config');
  return response.json();
}
