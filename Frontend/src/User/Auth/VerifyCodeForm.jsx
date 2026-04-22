import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:3010/api/auth";

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
  const [success, setSuccess] = useState("");

  const isSubmittingRef = useRef(false);

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

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Ошибка подтверждения кода");
        return;
      }

      setSuccess(data.message || "Регистрация завершена");

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 700);
      }
    } catch (err) {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoadingVerify(false);
      isSubmittingRef.current = false;
    }
  };

  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < newCode.length - 1) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
      nextInput?.focus();
    }

    const fullCode = newCode.join("");

    if (fullCode.length === 4 && !newCode.includes("")) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && code[index] === "" && index > 0) {
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`);
      prevInput?.focus();
    }
  };

  const handleResendCode = async () => {
    if (timer > 0) return;

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

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Ошибка повторной отправки кода");
        return;
      }

      setSuccess(data.message || "Новый код отправлен");
      setTimer(data.resendAfter || 30);
      setCode(["", "", "", ""]);
    } catch (err) {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <div>
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
              data-index={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loadingVerify}
            />
          ))}
        </div>

        {loadingVerify && <p className="auth-success">Проверка кода...</p>}
      </div>

      <button
        className="verify-cod"
        type="button"
        onClick={handleResendCode}
        disabled={timer > 0 || loadingResend || loadingVerify}
      >
        {timer > 0
          ? `Отправить новый код через ${timer} сек`
          : loadingResend
          ? "Отправка..."
          : "Отправить новый код"}
      </button>

      {error && <p className="auth-error">{error}</p>}
      {success && <p className="auth-success">{success}</p>}
    </div>
  );
}