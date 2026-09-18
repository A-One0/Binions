const localStorage = window.localStorage

function checkToken() {

}

if (localStorage.getItem('token')) {
  window.location.href = '/'

}

const tkt = fetch('/netlify/functions/Mainlogin', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'}
    }
);