const AUTH_ACCOUNTS_KEY = 'routineflow_accounts';
const AUTH_SESSION_KEY = 'routineflow_session';

const authForm = document.getElementById('authForm');
const authMessage = document.getElementById('authMessage');
const authMode = document.body.dataset.authMode;

function getAccounts() {
    const storedAccounts = localStorage.getItem(AUTH_ACCOUNTS_KEY);
    return storedAccounts ? JSON.parse(storedAccounts) : [];
}

function setMessage(message) {
    authMessage.textContent = message;
}

if (localStorage.getItem(AUTH_SESSION_KEY)) {
    window.location.replace('index.html');
}

authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(authForm);
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');
    const accounts = getAccounts();

    if (authMode === 'signup') {
        const name = formData.get('name').trim();

        if (!name || password.length < 6) {
            setMessage('Enter your name and a password with at least 6 characters.');
            return;
        }

        if (accounts.some((account) => account.email === email)) {
            setMessage('An account with that email already exists.');
            return;
        }

        accounts.push({ name, email, password });
        localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ name, email }));
        window.location.href = 'index.html';
        return;
    }

    const account = accounts.find((candidate) => candidate.email === email && candidate.password === password);
    if (!account) {
        setMessage('Email or password is incorrect.');
        return;
    }

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ name: account.name, email: account.email }));
    window.location.href = 'index.html';
});
