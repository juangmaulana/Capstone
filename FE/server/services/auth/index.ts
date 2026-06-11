import { ApiError } from '@/lib/api/api-error';

const AUTH_API_URL = process.env.AUTH_API_URL

export const authenticate = async (accessToken: string) => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/authenticate`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const json = await response.json();
  if (!json.success) {
    return null;
  }

  return json.data
}

export const login = async (email: string, password: string) => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const json = await response.json();
  if (!json.success) {
    if (json.error.statusCode == 400) {
      throw new ApiError('BAD_REQUEST', json.error.message);
    }
    if (json.error.statusCode == 429) {
      throw new ApiError('TOO_MANY_REQUEST', json.error.message);
    }
    throw new Error(`[Auth Service] ${json.error.message}`);
  }

  return json.data
};

export const logout = async (refreshToken: string) => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      cookie: `refresh_token=${refreshToken}`
    }
  });

  const json = await response.json();
  if (!json.success) {
    if (json.error.statusCode == 401) {
      throw new ApiError('UNAUTHORIZED', json.error.message);
    }
    throw new Error(`[Auth Service] ${json.error.message}`);
  }

  return json.data;
}

export const refresh = async (refreshToken: string, throwError: boolean = true) => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      cookie: `refresh_token=${refreshToken}`
    }
  });

  const json = await response.json();
  if (!json.success && throwError) {
    if (json.error.statusCode == 401) {
      throw new ApiError('UNAUTHORIZED', json.error.message);
    }
    throw new Error(`[Auth Service] ${json.error.message}`);
  }

  return json.data;
}

export const getProfile = async (accessToken: string) => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const json = await response.json();
  if (!json.success) {
    if (json.error.statusCode == 401) {
      throw new ApiError('UNAUTHORIZED', json.error.message);
    }
    throw new Error(`[Auth Service] ${json.error.message}`);
  }

  return json.data
};

export const forgotPassword = async (email: string) => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(`[Auth Service] ${json.error.message}`);
  }

  return json.data;
}

export const verifyResetCode = async (email: string, code: string) => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/verify-reset-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });

  const json = await response.json();
  if (!json.success) {
    if (json.error.statusCode == 400) {
      throw new ApiError('BAD_REQUEST', json.error.message);
    }
    if (json.error.statusCode == 401) {
      throw new ApiError('UNAUTHORIZED', json.error.message);
    }
    throw new Error(`[Auth Service] ${json.error.message}`);
  }

  return json.data;
}

export const resetPassword = async (resetToken: string, newPassword: string) => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetToken, newPassword })
  });

  const json = await response.json();
  if (!json.success) {
    if (json.error.statusCode == 401) {
      throw new ApiError('UNAUTHORIZED', json.error.message);
    }
    throw new Error(`[Auth Service] ${json.error.message}`);
  }

  return json.data;
}

export const changePassword = async (accessToken: string, userId: number, oldPassword: string, newPassword: string) => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/change-password/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ oldPassword, newPassword })
  })

  const json = await response.json()
  if (!json.success) {
    if (json.error.statusCode === 401) {
      throw new ApiError('UNAUTHORIZED', json.error.message);
    }
    if (json.error.statusCode === 403) {
      throw new ApiError('FORBIDDEN', json.error.message);
    }
    throw new Error(`[Auth Service] ${json.error.code} | ${json.error.message}`)
  }

  return json.data
}

export const hashPassword = async (password: string): Promise<{ passwordHash: string }> => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/hash-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })

  const json = await response.json()
  if (!json.success) {
    throw new Error(`[Auth Service] ${json.error.code} | ${json.error.message}`)
  }

  return json.data
}