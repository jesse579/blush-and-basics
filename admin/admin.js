import { supabase, isSupabaseConfigured } from './supabase-config.js';

const form = document.querySelector('#loginForm');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const message = document.querySelector('#message');
const submitBtn = document.querySelector('#submitBtn');
const togglePassword = document.querySelector('#togglePassword');

const showMessage = (text, type = 'error') => {
  message.textContent = text;
  message.classList.toggle('success', type === 'success');
};

async function checkExistingAdminSession() {
  if (!isSupabaseConfigured) {
    showMessage('Add your Supabase Project URL and publishable key in supabase-config.js first.');
    return;
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return;

  if (session.user?.app_metadata?.role === 'admin') {
    window.location.replace('./dashboard.html');
  } else {
    await supabase.auth.signOut();
    showMessage('This account is not authorized as an administrator.');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage('');

  if (!isSupabaseConfigured) {
    showMessage('Add your Supabase Project URL and publishable key in supabase-config.js first.');
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) {
    showMessage('Enter your administrator email and password.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in…';

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user?.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('This account is not authorized as an administrator.');
    }

    showMessage('Login successful. Opening your dashboard…', 'success');
    window.location.replace('./dashboard.html');
  } catch (error) {
    showMessage(error.message || 'Unable to sign in. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
  }
});

togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePassword.textContent = isPassword ? 'Hide' : 'Show';
  togglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
});

document.querySelector('#year').textContent = new Date().getFullYear();
checkExistingAdminSession();
