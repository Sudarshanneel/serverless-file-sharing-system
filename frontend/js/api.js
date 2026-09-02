async function apiRequest(path, options = {}) {
  const token = getIdToken();

  const headers = {
    Authorization: token,
    ...(options.headers || {}),
  };

  const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

async function listFiles() {
  return apiRequest("/files", { method: "GET" });
}

async function requestUploadUrl(fileName, fileType, fileSize) {
  return apiRequest("/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, fileType, fileSize }),
  });
}

async function uploadToS3(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("Upload to storage failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload to storage failed"));
    xhr.send(file);
  });
}

async function getDownloadUrl(fileId) {
  return apiRequest(`/files/${fileId}`, { method: "GET" });
}

async function deleteFile(fileId) {
  return apiRequest(`/files/${fileId}`, { method: "DELETE" });
}

async function renameFile(fileId, fileName) {
  return apiRequest(`/files/${fileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName }),
  });
}

async function createShareLink(fileId, expiryHours) {
  return apiRequest(`/files/${fileId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiryHours }),
  });
}

async function revokeShareLink(fileId) {
  return apiRequest(`/files/${fileId}/share`, { method: "DELETE" });
}
