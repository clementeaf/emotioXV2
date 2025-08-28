interface TokenInfo {
  isValid: boolean;
  expiresAt?: Date;
  timeRemaining?: string;
  payload?: any;
}

export const parseJwt = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const analyzeToken = (token: string): TokenInfo => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false };
    }

    const payload = parseJwt(token);

    if (!payload) {
      return { isValid: false };
    }

    let expiresAt: Date | undefined = undefined;
    let timeRemaining: string | undefined = undefined;
    let isValid = true;

    if (payload.exp) {
      expiresAt = new Date(payload.exp * 1000);
      const now = new Date();
      isValid = now < expiresAt;

      const diffMs = expiresAt.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);

      if (diffMins <= 0) {
        timeRemaining = `Expirado hace ${Math.abs(diffMins)} minutos`;
      } else {
        timeRemaining = `Expira en ${diffMins} minutos`;
      }
    }

    return {
      isValid,
      expiresAt,
      timeRemaining,
      payload
    };
  } catch (error) {
    return { isValid: false };
  }
};
