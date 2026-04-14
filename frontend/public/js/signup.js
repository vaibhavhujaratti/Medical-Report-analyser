import { auth, createUserWithEmailAndPassword } from './firebase-config.js';

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');
  
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    window.location.href = '/login';
  } catch (error) {
    errorMsg.textContent = error.message;
  }
});
