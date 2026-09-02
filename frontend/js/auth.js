const COGNITO_ENDPOINT = `https://cognito-idp.${CONFIG.COGNITO_REGION}.amazonaws.com/`;

async function cognitoRequest(action, payload) {
  const response = await fetch(COGNITO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

async function signUp(email, password) {
  return cognitoRequest("SignUp", {
    ClientId: CONFIG.COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  });
}

async function confirmSignUp(email, code) {
  return cognitoRequest("ConfirmSignUp", {
    ClientId: CONFIG.COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

async function login(email, password) {
  const result = await cognitoRequest("InitiateAuth", {
    ClientId: CONFIG.COGNITO_CLIENT_ID,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const { IdToken, AccessToken, RefreshToken, ExpiresIn } = result.AuthenticationResult;

  localStorage.setItem("idToken", IdToken);
  localStorage.setItem("accessToken", AccessToken);
  localStorage.setItem("refreshToken", RefreshToken);
  localStorage.setItem("tokenExpiry", Date.now() + ExpiresIn * 1000);
  localStorage.setItem("userEmail", email);

  return result;
}

function logout() {
  localStorage.removeItem("idToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenExpiry");
  localStorage.removeItem("userEmail");
  window.location.href = "login.html";
}

function getIdToken() {
  return localStorage.getItem("idToken");
}

function getUserEmail() {
  return localStorage.getItem("userEmail") || "";
}

function isLoggedIn() {
  const token = getIdToken();
  const expiry = localStorage.getItem("tokenExpiry");
  if (!token || !expiry) return false;
  return Date.now() < Number(expiry);
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}
