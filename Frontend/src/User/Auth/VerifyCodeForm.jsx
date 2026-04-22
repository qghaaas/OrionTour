import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:3010/api/auth";
const EMPTY_CODE = ["", "", "", ""];
const CODE_LENGTH = 4;

export default function VerifyCodeForm({
  email,
  password,
  onBack,
  onSuccess,
}) {
  const [code, setCode] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [error, setError] = useState("");

  const isSubmittingRef = useRef(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const verifyCode = async (value) => {
    if (isSubmittingRef.current) return;

    if (!/^\d{4}$/.test(value)) {
      setError("Введите корректный код");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setLoadingVerify(true);
      setError("");

      const response = await fetch(`${API_URL}/register/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: value }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Ошибка подтверждения кода");
        return;
      }

      onSuccess?.();
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoadingVerify(false);
      isSubmittingRef.current = false;
    }
  };

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    setError("");

    const nextCode = [...code];
    nextCode[index] = value;
    setCode(nextCode);

    if (value && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    const fullCode = nextCode.join("");

    if (!nextCode.includes("") && fullCode.length === CODE_LENGTH) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (timer > 0) return;

    try {
      setLoadingResend(true);
      setError("");

      const response = await fetch(`${API_URL}/register/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Ошибка повторной отправки кода");
        return;
      }

      setCode(EMPTY_CODE);
      setTimer(data.resendAfter || 30);
      inputsRef.current[0]?.focus();
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoadingResend(false);
    }
  };

  const hasError = Boolean(error);

  return (
    <>
      <h2>Введите код из письма</h2>

      <div className="verify-sub_text">
        <p>Мы отправили его на почту</p>
        <p>{email}</p>
      </div>

      <div className="form-verify">
        <div className="verify-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loadingVerify}
              className={hasError ? "verify-input verify-input-error" : "verify-input"}
            />
          ))}
        </div>

        <div className="verify-message">
          {loadingVerify && <p className="auth-success">Проверка кода...</p>}
          {!loadingVerify && error && (
            <p className="auth-error auth-error-verif">{error}</p>
          )}
        </div>
      </div>

      <button
        className="verify-cod"
        type="button"
        onClick={handleResendCode}
        disabled={timer > 0 || loadingResend || loadingVerify}
      >
        {timer > 0 ? (
          <span className="verify-cod-disabled">
            Отправить новый код через {timer} сек
          </span>
        ) : loadingResend ? (
          "Отправка..."
        ) : (
          <span className="verify-cod-active">Отправить новый код</span>
        )}
      </button>
    </>
  );
}