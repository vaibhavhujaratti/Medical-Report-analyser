import { auth, signInWithEmailAndPassword } from './firebase-config.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = '/';
  } catch (error) {
    errorMsg.textContent = error.message;
  }
});
