import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:3010/api/auth";
const CODE_LENGTH = 4;

const NETWORK_ERROR_MESSAGE =
  "Не удалось подключиться к серверу. Проверьте интернет-соединение, отключите VPN или прокси и повторите попытку.";

const getResponseData = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const getVerifyErrorMessage = (status, data) => {
  const serverMessage = data?.message;
  const serverCode = data?.code;

  if (serverCode === "INVALID_CODE" || status === 400) {
    return serverMessage || "Неверный код подтверждения. Проверьте письмо и попробуйте снова.";
  }

  if (serverCode === "CODE_EXPIRED" || status === 410) {
    return "Срок действия кода истёк. Отправьте новый код и попробуйте снова.";
  }

  if (status === 429) {
    return "Слишком много попыток ввода кода. Подождите несколько минут и попробуйте снова.";
  }

  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return "Сервер временно недоступен. Попробуйте подтвердить код позже.";
  }

  return serverMessage || "Не удалось подтвердить код. Попробуйте снова.";
};

const getResendErrorMessage = (status, data) => {
  const serverMessage = data?.message;
  const serverCode = data?.code;

  if (serverCode === "MAIL_NOT_SENT" || serverCode === "EMAIL_SEND_ERROR") {
    return "Не удалось отправить новый код. Проверьте соединение, отключите VPN или прокси и попробуйте позже.";
  }

  if (status === 429) {
    return "Слишком много запросов на отправку кода. Подождите несколько минут и попробуйте снова.";
  }

  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return "Сервер временно не смог отправить код. Попробуйте позже.";
  }

  return serverMessage || "Не удалось отправить новый код. Попробуйте позже.";
};

export default function VerifyCodeForm({
  email,
  password,
  onBack,
  onSuccess,
}) {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [timer, setTimer] = useState(30);

  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputRefs = useRef([]);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const focusInput = (index) => {
    inputRefs.current[index]?.focus();
  };

  const setCodeAndVerify = (newCode) => {
    setCode(newCode);

    const fullCode = newCode.join("");

    if (fullCode.length === CODE_LENGTH && !newCode.includes("")) {
      verifyCode(fullCode);
    }
  };

  const verifyCode = async (fullCode) => {
    if (isSubmittingRef.current) return;

    try {
      isSubmittingRef.current = true;
      setLoadingVerify(true);
      resetMessages();

      const response = await fetch(`${API_URL}/register/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: fullCode,
        }),
      });

      const data = await getResponseData(response);

      if (!response.ok) {
        setError(getVerifyErrorMessage(response.status, data));
        return;
      }

      setSuccess(data.message || "Регистрация завершена.");

      setTimeout(() => {
        onSuccess?.();
      }, 700);
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
    } finally {
      setLoadingVerify(false);
      isSubmittingRef.current = false;
    }
  };

  const handleChange = (index, value) => {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      setError("");
      setSuccess("");
      return;
    }

    if (digits.length > 1) {
      handlePasteCode(index, digits);
      return;
    }

    const newCode = [...code];
    newCode[index] = digits[0];

    setError("");
    setSuccess("");
    setCodeAndVerify(newCode);

    if (index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handlePasteCode = (startIndex, pastedValue) => {
    const digits = pastedValue.replace(/\D/g, "").slice(0, CODE_LENGTH);

    if (!digits) return;

    const newCode = [...code];

    digits.split("").forEach((digit, offset) => {
      const targetIndex = startIndex + offset;

      if (targetIndex < CODE_LENGTH) {
        newCode[targetIndex] = digit;
      }
    });

    setError("");
    setSuccess("");
    setCodeAndVerify(newCode);

    const nextEmptyIndex = newCode.findIndex((digit) => digit === "");

    if (nextEmptyIndex !== -1) {
      focusInput(nextEmptyIndex);
    } else {
      focusInput(CODE_LENGTH - 1);
    }
  };

  const handlePaste = (index, e) => {
    e.preventDefault();

    const pastedValue = e.clipboardData.getData("text");
    handlePasteCode(index, pastedValue);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && code[index] === "" && index > 0) {
      focusInput(index - 1);
    }

    if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    }

    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0 || loadingResend || loadingVerify) return;

    try {
      setLoadingResend(true);
      resetMessages();

      const response = await fetch(`${API_URL}/register/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await getResponseData(response);

      if (!response.ok) {
        setError(getResendErrorMessage(response.status, data));
        return;
      }

      setSuccess(data.message || "Новый код отправлен.");
      setTimer(data.resendAfter || 30);
      setCode(Array(CODE_LENGTH).fill(""));
      focusInput(0);
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <div>
      <h2>Введите код из письма</h2>
      <div className="verify-sub_text">
        <p className="verify-main-text">Код отправлен на почту</p>
        <p className="verify-email">{email}</p>
        <p className="verify-help">
          Нет письма? Проверьте «Спам» или запросите новый код.
        </p>
      </div>

      <div className="form-verify">
        <div className="verify-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              data-index={index}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={CODE_LENGTH}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              value={digit}
              className={error ? "verify-input-error" : ""}
              aria-label={`Цифра ${index + 1} из ${CODE_LENGTH}`}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              disabled={loadingVerify}
            />
          ))}
        </div>

        {loadingVerify && <p className="auth-success">Проверка кода...</p>}
      </div>

      {error && <p className="auth-error">{error}</p>}
      {success && <p className="auth-success">{success}</p>}

      <button
        className={`verify-cod ${timer > 0 ? "verify-cod-disabled" : ""}`}
        type="button"
        onClick={handleResendCode}
        disabled={timer > 0 || loadingResend || loadingVerify}
      >
        {timer > 0
          ? `Новый код через ${timer} сек`
          : loadingResend
            ? "Отправка..."
            : "Отправить новый код"}
      </button>

      {onBack && (
        <button
          className="auth-notreg"
          type="button"
          onClick={onBack}
          disabled={loadingVerify || loadingResend}
        >
          Изменить почту
        </button>
      )}
    </div>
  );
}