const localStorage = window.localStorage

function checkToken() {

}

if (localStorage.getItem('token')) {
  window.location.href = '/'

}

document.getElementsByClassName("google-btn")[0].addEventListener("click", async function() {
  const response = await fetch('/netlify/functions/loginwithgoogle', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
});